import { prisma } from "../../../../lib/prisma";
import mobileSession from "../../../../lib/mobile-session.cjs";

export const dynamic="force-dynamic";

const corsHeaders={
  "Access-Control-Allow-Origin":process.env.MOBILE_APP_ORIGIN||"*",
  "Access-Control-Allow-Methods":"GET, OPTIONS",
  "Access-Control-Allow-Headers":"Content-Type, Authorization",
  "Cache-Control":"no-store, max-age=0",
};
const json=(body,status=200)=>Response.json(body,{status,headers:corsHeaders});

export function OPTIONS(){
  return new Response(null,{status:204,headers:corsHeaders});
}

export async function GET(request){
  try{
    const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
    const payload=mobileSession.verifyMobileSessionToken(token);
    const user=await prisma.user.findUnique({
      where:{publicId:payload.userId},
      select:{id:true,deletedAt:true,sessionVersion:true},
    });
    if(!user||user.deletedAt||user.sessionVersion!==payload.sessionVersion)throw new Error("INVALID_SESSION");

    const latest=await prisma.agencyApplication.findFirst({
      where:{userId:user.id},
      select:{publicId:true,status:true,agencyName:true,createdAt:true},
      orderBy:{createdAt:"desc"},
    });
    const application=!latest||latest.status==="REJECTED"
      ?null
      :{
        applicationId:latest.publicId,
        status:latest.status,
        agencyName:latest.agencyName,
        createdAt:latest.createdAt.toISOString(),
      };
    return json({success:true,data:{application}});
  }catch{
    return json({success:false,error:{code:"INVALID_SESSION",message:"The mobile session is invalid or expired."}},401);
  }
}
