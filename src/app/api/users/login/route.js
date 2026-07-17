import { prisma } from "../../../../lib/prisma";
import { verifyPassword } from "../../../../lib/password";
import mobileSession from "../../../../lib/mobile-session.cjs";

export async function POST(request) {
  let body;
  try{body=await request.json();}catch{return Response.json({success:false,error:{code:"INVALID_JSON",message:"Request body must be valid JSON."}},{status:400});}
  const phone=String(body?.phone??"").trim().replace(/[\s().-]/g,"");
  const password=String(body?.password??"");
  const user=await prisma.user.findUnique({where:{phone}});
  if(!user||!await verifyPassword(password,user.passwordHash))return Response.json({success:false,error:{code:"INVALID_CREDENTIALS",message:"Phone number or password is incorrect."}},{status:401});
  const ban=await prisma.ban.findFirst({where:{userId:user.id,target:"USER",revokedAt:null,OR:[{expiresAt:null},{expiresAt:{gt:new Date()}}]},orderBy:{createdAt:"desc"}});
  const data={sessionVersion:user.sessionVersion,forcedLogoutAt:user.forcedLogoutAt?.toISOString()??null,isBanned:Boolean(ban),banReason:ban?.reason??null,banExpiresAt:ban?.expiresAt?.toISOString()??null};
  if(ban)return Response.json({success:true,data},{status:403});
  await prisma.user.update({where:{id:user.id},data:{lastLoginAt:new Date()}});
  return Response.json({success:true,data:{...data,user:{id:user.publicId,name:user.name,phone:user.phone,email:user.email},sessionToken:mobileSession.createMobileSessionToken(user)}});
}
