import { auth } from "../../../../../../auth";
import { prisma } from "../../../../../lib/prisma";
import mobileSession from "../../../../../lib/mobile-session.cjs";

export async function GET(request,{params}) {
  const {assetId}=await params;
  const asset=await prisma.uploadAsset.findUnique({where:{publicId:assetId},select:{fileData:true,fileName:true,mimeType:true,assignedUserId:true}});
  if(!asset)return Response.json({success:false,error:{code:"ASSET_NOT_FOUND",message:"Upload not found."}},{status:404});

  const session=await auth();
  if(!session?.user){
    try {
      const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
      const payload=mobileSession.verifyMobileSessionToken(token);
      const user=await prisma.user.findUnique({where:{publicId:payload.userId},select:{id:true,deletedAt:true,sessionVersion:true}});
      if(!user||user.deletedAt||user.sessionVersion!==payload.sessionVersion||asset.assignedUserId&&asset.assignedUserId!==user.id)throw new Error("FORBIDDEN");
    } catch {
      return Response.json({success:false,error:{code:"UNAUTHORIZED",message:"A valid session is required to access this upload."}},{status:401});
    }
  }

  return new Response(asset.fileData,{headers:{"Content-Type":asset.mimeType,"Content-Length":String(asset.fileData.byteLength),"Content-Disposition":`inline; filename*=UTF-8''${encodeURIComponent(asset.fileName)}`,"Cache-Control":"private, max-age=3600","Access-Control-Allow-Origin":process.env.MOBILE_APP_ORIGIN||"*"}});
}
