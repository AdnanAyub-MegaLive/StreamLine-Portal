const { createServer } = require("node:http");
const next = require("next");
const { Server } = require("socket.io");
const { loadEnvConfig } = require("@next/env");
const { verifyMobileSessionToken } = require("./src/lib/mobile-session.cjs");

loadEnvConfig(process.cwd());
const dev=process.argv.includes("--dev");
const hostname=process.env.HOSTNAME||"0.0.0.0";
const port=Number(process.env.PORT||3000);
const app=next({dev,hostname,port});
const handle=app.getRequestHandler();

app.prepare().then(async()=>{
  const {prisma}=await import("./src/lib/prisma.js");
  const httpServer=createServer((request,response)=>handle(request,response));
  const io=new Server(httpServer,{cors:{origin:process.env.MOBILE_APP_ORIGIN||"*",methods:["GET","POST"]}});
  globalThis.portalIo=io;
  globalThis.portalDisconnectUser=(publicId)=>setTimeout(()=>io.in(`user:${publicId}`).disconnectSockets(true),100);
  const scheduleBanExpiry=(publicId,expiresAt)=>{
    if(!expiresAt)return;
    const remaining=new Date(expiresAt).getTime()-Date.now();
    if(remaining>2147483647)return setTimeout(()=>scheduleBanExpiry(publicId,expiresAt),2147483647);
    setTimeout(async()=>{
      const user=await prisma.user.findUnique({where:{publicId}});
      if(!user)return;
      const now=new Date();
      await prisma.ban.updateMany({where:{userId:user.id,target:"USER",revokedAt:null,expiresAt:{lte:now}},data:{revokedAt:now}});
      const activeBan=await prisma.ban.findFirst({where:{userId:user.id,target:"USER",revokedAt:null,OR:[{expiresAt:null},{expiresAt:{gt:now}}]},orderBy:{createdAt:"desc"}});
      if(!activeBan){
        await prisma.user.update({where:{id:user.id},data:{status:"ACTIVE"}});
        io.to(`user:${publicId}`).emit("account:unbanned",{success:true,data:{sessionVersion:user.sessionVersion,forcedLogoutAt:user.forcedLogoutAt?.toISOString()??null,isBanned:false,banReason:null,banExpiresAt:null}});
      }
    },Math.max(remaining,0));
  };
  globalThis.portalScheduleBanExpiry=scheduleBanExpiry;
  const timedBans=await prisma.ban.findMany({where:{target:"USER",userId:{not:null},revokedAt:null,expiresAt:{gt:new Date()}},include:{user:{select:{publicId:true}}}});
  for(const ban of timedBans)scheduleBanExpiry(ban.user.publicId,ban.expiresAt);

  const releaseEmptyAudioRoom=async(roomId)=>{
    const socketRoom=`audio-room:${roomId}`;
    if((io.sockets.adapter.rooms.get(socketRoom)?.size??0)>0)return false;
    const room=await prisma.audioRoom.findUnique({where:{roomId},include:{owner:{select:{publicId:true}}}});
    if(!room||room.status!=="LIVE")return false;
    const endedAt=new Date();
    await prisma.audioRoom.update({where:{id:room.id},data:{status:"IDLE",participantCount:0,liveAudioUrl:null,endedAt}});
    await prisma.auditLog.create({data:{action:"AUDIO_ROOM_AUTO_RELEASED",category:"USER_MANAGEMENT",entityType:"AudioRoom",entityId:roomId,description:`Audio room ${roomId} became empty; live resources were released and its persistent ID was retained.`,metadata:{source:"SOCKET_IO",ownerId:room.owner.publicId,persistentRoomId:true}}});
    io.to(`user:${room.owner.publicId}`).emit("audio-room:idle",{success:true,data:{roomId,status:"IDLE",endedAt:endedAt.toISOString(),roomIdRetained:true}});
    return true;
  };

  io.use(async(socket,nextSocket)=>{
    try{
      const payload=verifyMobileSessionToken(socket.handshake.auth?.token);
      const user=await prisma.user.findUnique({where:{publicId:payload.userId}});
      if(!user||user.deletedAt||user.sessionVersion!==payload.sessionVersion)return nextSocket(new Error("SESSION_REVOKED"));
      const ban=await prisma.ban.findFirst({where:{userId:user.id,target:"USER",revokedAt:null,OR:[{expiresAt:null},{expiresAt:{gt:new Date()}}]}});
      if(ban){const error=new Error("ACCOUNT_BANNED");error.data={banReason:ban.reason,banExpiresAt:ban.expiresAt?.toISOString()??null};return nextSocket(error);}
      socket.data.userId=user.publicId;
      nextSocket();
    }catch(error){nextSocket(new Error(error.message||"UNAUTHORIZED"));}
  });

  io.on("connection",async(socket)=>{
    const userId=socket.data.userId;
    socket.join(`user:${userId}`);
    const user=await prisma.user.findUnique({where:{publicId:userId}});
    const ban=await prisma.ban.findFirst({where:{userId:user.id,target:"USER",revokedAt:null,OR:[{expiresAt:null},{expiresAt:{gt:new Date()}}]},orderBy:{createdAt:"desc"}});
    socket.emit("session:status",{success:true,data:{sessionVersion:user.sessionVersion,forcedLogoutAt:user.forcedLogoutAt?.toISOString()??null,isBanned:Boolean(ban),banReason:ban?.reason??null,banExpiresAt:ban?.expiresAt?.toISOString()??null}});
    socket.on("audio-room:join",async({roomId}={},ack=()=>{})=>{
      const room=await prisma.audioRoom.findUnique({where:{roomId:String(roomId??"")}});
      if(!room||room.isBlocked||room.joiningDisabled||room.status!=="LIVE")return ack({success:false,error:{code:"ROOM_UNAVAILABLE"}});
      socket.join(`audio-room:${room.roomId}`);
      const participantCount=io.sockets.adapter.rooms.get(`audio-room:${room.roomId}`)?.size??1;
      await prisma.audioRoom.update({where:{id:room.id},data:{participantCount}});
      ack({success:true,data:{roomId:room.roomId}});
    });
    socket.on("audio-room:leave",async({roomId}={},ack=()=>{})=>{
      const id=String(roomId??"");
      await socket.leave(`audio-room:${id}`);
      const participantCount=io.sockets.adapter.rooms.get(`audio-room:${id}`)?.size??0;
      if(participantCount)await prisma.audioRoom.updateMany({where:{roomId:id,status:"LIVE"},data:{participantCount}});
      else await releaseEmptyAudioRoom(id);
      ack({success:true,data:{roomId:id,participantCount,idRetained:true}});
    });
    socket.on("disconnecting",()=>{
      const roomIds=[...socket.rooms].filter((name)=>name.startsWith("audio-room:")).map((name)=>name.slice(11));
      for(const roomId of roomIds)setTimeout(()=>releaseEmptyAudioRoom(roomId).catch(console.error),0);
    });
  });

  httpServer.listen(port,hostname,()=>console.log(`> Portal and Socket.IO ready on http://${hostname}:${port}`));
});
