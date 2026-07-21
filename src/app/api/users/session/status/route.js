import { prisma } from "../../../../../lib/prisma";
import mobileSession from "../../../../../lib/mobile-session.cjs";
import { getEffectiveUserId, reconcileExpiredSpecialIds } from "../../../../../lib/special-id";
import { reconcileExpiredBans } from "../../../../../lib/ban-maintenance";

export async function GET(request) {
  const macAddress=new URL(request.url).searchParams.get("macAddress")?.trim();
  if(!macAddress)return Response.json({success:false,error:{code:"DEVICE_ID_REQUIRED",message:"macAddress query parameter is required."}},{status:422});
  try{
    const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
    const payload=mobileSession.verifyMobileSessionToken(token);
    const user=await prisma.user.findUnique({where:{publicId:payload.userId}});
    if(!user||user.deletedAt)return Response.json({success:false,error:{code:"USER_NOT_FOUND",message:"User not found."}},{status:404});
    await reconcileExpiredBans();
    const ban=await prisma.ban.findFirst({where:{userId:user.id,target:"USER",revokedAt:null,OR:[{expiresAt:null},{expiresAt:{gt:new Date()}}]},orderBy:{createdAt:"desc"}});
    const device=await prisma.device.findUnique({where:{userId_macAddress:{userId:user.id,macAddress}}});
    const deviceBan=device?.isBanned?await prisma.ban.findFirst({where:{deviceId:device.id,target:"DEVICE",revokedAt:null,OR:[{expiresAt:null},{expiresAt:{gt:new Date()}}]},orderBy:{createdAt:"desc"}}):null;
    await reconcileExpiredSpecialIds();
    const identity=await getEffectiveUserId(user.id,user.publicId);
    return Response.json({success:true,data:{sessionVersion:user.sessionVersion,forcedLogoutAt:user.forcedLogoutAt?.toISOString()??null,isBanned:Boolean(ban),banReason:ban?.reason??null,banExpiresAt:ban?.expiresAt?.toISOString()??null,deviceBanned:Boolean(device?.isBanned),deviceBanReason:deviceBan?.reason??null,deviceBanExpiresAt:deviceBan?.expiresAt?.toISOString()??null,macAddress,id:identity.effectiveId,normalId:identity.normalId,specialId:identity.specialId,specialIdExpiresAt:identity.specialIdExpiresAt?.toISOString()??null}});
  }catch{return Response.json({success:false,error:{code:"INVALID_SESSION",message:"The mobile session is invalid or expired."}},{status:401});}
}
