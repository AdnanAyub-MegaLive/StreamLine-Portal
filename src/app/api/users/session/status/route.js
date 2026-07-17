import { prisma } from "../../../../../lib/prisma";
import mobileSession from "../../../../../lib/mobile-session.cjs";

export async function GET(request) {
  try{
    const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
    const payload=mobileSession.verifyMobileSessionToken(token);
    const user=await prisma.user.findUnique({where:{publicId:payload.userId}});
    if(!user)return Response.json({success:false,error:{code:"USER_NOT_FOUND",message:"User not found."}},{status:404});
    const ban=await prisma.ban.findFirst({where:{userId:user.id,target:"USER",revokedAt:null,OR:[{expiresAt:null},{expiresAt:{gt:new Date()}}]},orderBy:{createdAt:"desc"}});
    return Response.json({success:true,data:{sessionVersion:user.sessionVersion,forcedLogoutAt:user.forcedLogoutAt?.toISOString()??null,isBanned:Boolean(ban),banReason:ban?.reason??null,banExpiresAt:ban?.expiresAt?.toISOString()??null}});
  }catch{return Response.json({success:false,error:{code:"INVALID_SESSION",message:"The mobile session is invalid or expired."}},{status:401});}
}
