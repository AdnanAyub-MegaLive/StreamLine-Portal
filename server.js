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

  io.use(async(socket,nextSocket)=>{
    try{
      const payload=verifyMobileSessionToken(socket.handshake.auth?.token);
      const user=await prisma.user.findUnique({where:{publicId:payload.userId}});
      if(!user||user.sessionVersion!==payload.sessionVersion)return nextSocket(new Error("SESSION_REVOKED"));
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
  });

  httpServer.listen(port,hostname,()=>console.log(`> Portal and Socket.IO ready on http://${hostname}:${port}`));
});
