import { prisma } from "../../../lib/prisma";
import mobileSession from "../../../lib/mobile-session.cjs";

const cors={"Access-Control-Allow-Origin":process.env.MOBILE_APP_ORIGIN||"*","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type, Authorization"};
const json=(body,status=200)=>Response.json(body,{status,headers:cors});
const optional=(value)=>typeof value==="string"&&value.trim()?value.trim():null;

async function authenticatedUser(request){
  const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
  const payload=mobileSession.verifyMobileSessionToken(token);
  const user=await prisma.user.findUnique({where:{publicId:payload.userId}});
  if(!user||user.deletedAt||user.sessionVersion!==payload.sessionVersion)throw new Error("INVALID_SESSION");
  return user;
}

const createRoomId=()=>`ROOM-${crypto.randomUUID().replaceAll("-","").slice(0,12).toUpperCase()}`;
export function OPTIONS(){return new Response(null,{status:204,headers:cors});}

export async function GET(request){
  try{
    const user=await authenticatedUser(request);
    const room=await prisma.audioRoom.findUnique({where:{ownerId:user.id}});
    return json({success:true,data:{room:room?serializeRoom(room):null,rooms:room?[serializeRoom(room)]:[]}});
  }catch{return json({success:false,error:{code:"INVALID_SESSION",message:"The mobile session is invalid or expired."}},401);}
}

export async function POST(request){
  try{
    const user=await authenticatedUser(request);
    const body=await request.json();
    const action=String(body?.action??"START").trim().toUpperCase();
    let existing=await prisma.audioRoom.findUnique({where:{ownerId:user.id}});

    if(["EXIT","EMPTY","END"].includes(action)){
      if(!existing)return json({success:false,error:{code:"ROOM_NOT_FOUND",message:"This user does not have an assigned room."}},404);
      const room=await makeRoomIdle(existing,body);
      await writeAudit(user,"AUDIO_ROOM_EMPTIED",room.roomId,`User ${user.publicId} ended audio room ${room.roomId}`);
      return json({success:true,data:{room:serializeRoom(room),roomId:room.roomId,reused:true}});
    }

    if(!["START","CREATE","UPDATE"].includes(action))return json({success:false,error:{code:"INVALID_ACTION",message:"Use START, CREATE, UPDATE, EXIT, EMPTY or END."}},422);
    if(existing?.isBlocked)return json({success:false,error:{code:"ROOM_BLOCKED",message:"This room has been blocked by an administrator."}},403);
    const title=String(body?.title??existing?.title??`${user.name}'s Room`).trim();
    if(title.length<2||title.length>120)return json({success:false,error:{code:"VALIDATION_ERROR",message:"Room title must contain 2 to 120 characters."}},422);

    const now=new Date();
    const data={title,status:"LIVE",liveAudioUrl:validUrl(body.liveAudioUrl),recordingUrl:validUrl(body.recordingUrl)??existing?.recordingUrl??null,participantCount:Math.max(0,Number(body.participantCount)||0),joiningDisabled:false,blockedReason:null,startedAt:now,endedAt:null};
    const created=!existing;
    existing=await prisma.audioRoom.upsert({where:{ownerId:user.id},update:data,create:{roomId:createRoomId(),ownerId:user.id,...data}});
    await writeAudit(user,created?"AUDIO_ROOM_ID_ASSIGNED":"AUDIO_ROOM_RESTARTED",existing.roomId,created?`System assigned audio room ${existing.roomId} to user ${user.publicId}`:`User ${user.publicId} restarted assigned audio room ${existing.roomId}`);
    return json({success:true,data:{room:serializeRoom(existing),roomId:existing.roomId,reused:!created}},created?201:200);
  }catch(error){
    if(error instanceof SyntaxError)return json({success:false,error:{code:"INVALID_JSON",message:"Request body must be valid JSON."}},400);
    if(error.message==="INVALID_SESSION")return json({success:false,error:{code:"INVALID_SESSION",message:"The mobile session is invalid or expired."}},401);
    console.error("Audio room request failed",error);
    return json({success:false,error:{code:"AUDIO_ROOM_REQUEST_FAILED",message:"Unable to process the room request."}},500);
  }
}

async function makeRoomIdle(room,body={}){
  return prisma.audioRoom.update({where:{id:room.id},data:{status:"IDLE",participantCount:0,liveAudioUrl:null,recordingUrl:validUrl(body.recordingUrl)??room.recordingUrl,endedAt:new Date()}});
}
async function writeAudit(user,action,roomId,description){return prisma.auditLog.create({data:{action,category:"USER_MANAGEMENT",entityType:"AudioRoom",entityId:roomId,description,metadata:{source:"MOBILE_APP",ownerId:user.publicId,persistentRoomId:true}}});}
function validUrl(value){const text=optional(value);if(!text)return null;try{const url=new URL(text);return ["http:","https:"].includes(url.protocol)?text:null;}catch{return null;}}
function serializeRoom(room){return {roomId:room.roomId,title:room.title,status:room.status,liveAudioUrl:room.liveAudioUrl,recordingUrl:room.recordingUrl,participantCount:room.participantCount,joiningDisabled:room.joiningDisabled,isBlocked:room.isBlocked,blockedReason:room.blockedReason,startedAt:room.startedAt.toISOString(),endedAt:room.endedAt?.toISOString()??null,updatedAt:room.updatedAt.toISOString()};}
