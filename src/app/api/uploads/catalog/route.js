import { prisma } from "../../../../lib/prisma";
import mobileSession from "../../../../lib/mobile-session.cjs";
import { serializeUploadAsset, validUploadCategories } from "../../../../lib/upload-assets";

const corsHeaders={"Access-Control-Allow-Origin":process.env.MOBILE_APP_ORIGIN||"*","Access-Control-Allow-Methods":"GET, OPTIONS","Access-Control-Allow-Headers":"Content-Type, Authorization"};
const json=(body,status=200)=>Response.json(body,{status,headers:corsHeaders});
export function OPTIONS(){return new Response(null,{status:204,headers:corsHeaders});}

export async function GET(request) {
  try {
    const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
    const payload=mobileSession.verifyMobileSessionToken(token);
    const user=await prisma.user.findUnique({where:{publicId:payload.userId},select:{id:true,deletedAt:true,sessionVersion:true}});
    if(!user||user.deletedAt||user.sessionVersion!==payload.sessionVersion)throw new Error("INVALID_SESSION");
    const url=new URL(request.url);
    const category=url.searchParams.get("category")?.toUpperCase().replaceAll("-","_").replaceAll(" ","_");
    if(category&&!validUploadCategories.has(category))return json({success:false,error:{code:"INVALID_CATEGORY",message:"Upload category is invalid."}},422);
    const roomBackground=url.searchParams.get("roomBackground")==="true";
    const assets=await prisma.uploadAsset.findMany({where:{...(category?{category}:{}),...(roomBackground?{isRoomBackground:true}:{}),OR:[{assignedUserId:null},{assignedUserId:user.id}]},include:{assignedUser:{select:{publicId:true,name:true,profileImage:true}}},orderBy:{createdAt:"desc"},take:200});
    const origin=url.origin;
    return json({success:true,data:{assets:assets.map((asset)=>serializeUploadAsset(asset,`${origin}/api/uploads/${asset.publicId}/file`))}});
  } catch {
    return json({success:false,error:{code:"INVALID_SESSION",message:"The mobile session is invalid or expired."}},401);
  }
}
