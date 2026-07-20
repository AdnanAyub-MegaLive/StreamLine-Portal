import { prisma } from "../../../lib/prisma";
import mobileSession from "../../../lib/mobile-session.cjs";

const cors={"Access-Control-Allow-Origin":process.env.MOBILE_APP_ORIGIN||"*","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type, Authorization"};
const json=(body,status=200)=>Response.json(body,{status,headers:cors});
const optional=(value)=>typeof value==="string"&&value.trim()?value.trim():null;

async function authenticatedUser(request) {
  const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
  const payload=mobileSession.verifyMobileSessionToken(token);
  const user=await prisma.user.findUnique({where:{publicId:payload.userId}});
  if(!user||user.deletedAt||user.sessionVersion!==payload.sessionVersion)throw new Error("INVALID_SESSION");
  return user;
}

export function OPTIONS(){return new Response(null,{status:204,headers:cors});}

export async function GET(request) {
  try{
    const user=await authenticatedUser(request);
    const rooms=await prisma.audioRoom.findMany({where:{ownerId:user.id},orderBy:{startedAt:"desc"},take:100});
    return json({success:true,data:{rooms:rooms.map(serializeRoom)}});
  }catch{return json({success:false,error:{code:"INVALID_SESSION",message:"The mobile session is invalid or expired."}},401);}
}

export async function POST(request) {
  try{
    const user=await authenticatedUser(request);
    const body=await request.json();
    const roomId=String(body?.roomId??"").trim();
    const title=String(body?.title??"").trim();
    if(!roomId||roomId.length>80||title.length<2||title.length>120)return json({success:false,error:{code:"VALIDATION_ERROR",message:"roomId and a title of 2 to 120 characters are required."}},422);
    const existing=await prisma.audioRoom.findUnique({where:{roomId}});
    if(existing&&existing.ownerId!==user.id)return json({success:false,error:{code:"ROOM_ID_EXISTS",message:"This room ID belongs to another account."}},409);
    if(existing?.isBlocked)return json({success:false,error:{code:"ROOM_BLOCKED",message:"This room has been blocked by an administrator."}},403);
    const status=["LIVE","ENDED"].includes(body.status)?body.status:"LIVE";
    const data={title,status,liveAudioUrl:validUrl(body.liveAudioUrl),recordingUrl:validUrl(body.recordingUrl),participantCount:Math.max(0,Number(body.participantCount)||0),startedAt:body.startedAt?new Date(body.startedAt):existing?.startedAt??new Date(),endedAt:body.endedAt?new Date(body.endedAt):status==="ENDED"?new Date():null};
    const room=await prisma.audioRoom.upsert({where:{roomId},update:data,create:{roomId,ownerId:user.id,...data}});
    await prisma.auditLog.create({data:{action:existing?"AUDIO_ROOM_UPDATED":"AUDIO_ROOM_CREATED",category:"USER_MANAGEMENT",entityType:"AudioRoom",entityId:roomId,description:`User ${user.publicId} ${existing?"updated":"created"} audio room ${roomId}`,metadata:{source:"MOBILE_APP",ownerId:user.publicId}}});
    return json({success:true,data:{room:serializeRoom(room)}},existing?200:201);
  }catch(error){if(error instanceof SyntaxError)return json({success:false,error:{code:"INVALID_JSON",message:"Request body must be valid JSON."}},400);return json({success:false,error:{code:"INVALID_SESSION",message:"The mobile session is invalid or expired."}},401);}
}

function validUrl(value){const text=optional(value);if(!text)return null;try{const url=new URL(text);return ["http:","https:"].includes(url.protocol)?text:null;}catch{return null;}}
function serializeRoom(room){return {roomId:room.roomId,title:room.title,status:room.status,liveAudioUrl:room.liveAudioUrl,recordingUrl:room.recordingUrl,participantCount:room.participantCount,joiningDisabled:room.joiningDisabled,isBlocked:room.isBlocked,blockedReason:room.blockedReason,startedAt:room.startedAt.toISOString(),endedAt:room.endedAt?.toISOString()??null,updatedAt:room.updatedAt.toISOString()};}
