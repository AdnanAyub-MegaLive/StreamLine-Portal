import { auth } from "../../../../auth";
import { prisma } from "../../../lib/prisma";
import { serializeUploadAsset, validUploadCategories } from "../../../lib/upload-assets";

const allowedTypes=new Set(["image/png","image/jpeg","image/webp","image/gif","video/mp4","video/webm"]);
const maxFileSize=15*1024*1024;

export async function POST(request) {
  const session=await auth();
  if(!session?.user)return Response.json({success:false,error:{code:"UNAUTHORIZED",message:"Administrator authentication is required."}},{status:401});

  try {
    const form=await request.formData();
    const name=String(form.get("name")??"").trim();
    const category=String(form.get("category")??"");
    const assignedUserPublicId=String(form.get("assignedUserId")??"").trim();
    const isRoomBackground=form.get("isRoomBackground")==="true"||category==="ROOM_BACKGROUNDS";
    const file=form.get("file");

    if(!name||name.length>80)return Response.json({success:false,error:{code:"VALIDATION_ERROR",message:"Name must contain 1 to 80 characters."}},{status:422});
    if(!validUploadCategories.has(category))return Response.json({success:false,error:{code:"VALIDATION_ERROR",message:"Upload category is invalid."}},{status:422});
    if(!(file instanceof File)||!file.size)return Response.json({success:false,error:{code:"VALIDATION_ERROR",message:"A media file is required."}},{status:422});
    if(!allowedTypes.has(file.type))return Response.json({success:false,error:{code:"UNSUPPORTED_MEDIA_TYPE",message:"Only PNG, JPG, WEBP, GIF, MP4, and WEBM files are supported."}},{status:415});
    if(file.size>maxFileSize)return Response.json({success:false,error:{code:"FILE_TOO_LARGE",message:"Files cannot exceed 15 MB."}},{status:413});

    const assignedUser=assignedUserPublicId?await prisma.user.findFirst({where:{publicId:assignedUserPublicId,deletedAt:null},select:{id:true}}):null;
    if(assignedUserPublicId&&!assignedUser)return Response.json({success:false,error:{code:"USER_NOT_FOUND",message:"The selected user no longer exists."}},{status:404});

    const publicId=`AST-${crypto.randomUUID().replaceAll("-","").slice(0,12).toUpperCase()}`;
    const asset=await prisma.$transaction(async(tx)=>{
      const created=await tx.uploadAsset.create({data:{publicId,name,category,fileName:file.name.slice(0,255),mimeType:file.type,fileSize:file.size,fileData:Buffer.from(await file.arrayBuffer()),assignedUserId:assignedUser?.id??null,isRoomBackground},include:{assignedUser:{select:{publicId:true,name:true,profileImage:true}}}});
      await tx.auditLog.create({data:{action:"UPLOAD_ASSET_CREATED",category:"CONTENT_MANAGEMENT",entityType:"UploadAsset",entityId:publicId,description:`${session.user.name??"Administrator"} uploaded ${name} to ${category}.`,metadata:{fileName:file.name,mimeType:file.type,fileSize:file.size,assignedUserId:assignedUserPublicId||null,isRoomBackground}}});
      return created;
    });
    return Response.json({success:true,data:{asset:serializeUploadAsset(asset,`/api/uploads/${asset.publicId}/file`)}},{status:201});
  } catch(error) {
    console.error("Asset upload failed",error);
    return Response.json({success:false,error:{code:"UPLOAD_FAILED",message:"Unable to store this upload right now."}},{status:500});
  }
}

export async function PATCH(request) {
  const session=await auth();
  if(!session?.user)return Response.json({success:false,error:{code:"UNAUTHORIZED",message:"Administrator authentication is required."}},{status:401});
  try {
    const body=await request.json();
    const assetId=String(body?.assetId??"");
    const assignedUserPublicId=body?.assignedUserId==null?"":String(body.assignedUserId).trim();
    const assignedUser=assignedUserPublicId?await prisma.user.findFirst({where:{publicId:assignedUserPublicId,deletedAt:null},select:{id:true}}):null;
    if(assignedUserPublicId&&!assignedUser)return Response.json({success:false,error:{code:"USER_NOT_FOUND",message:"The selected user no longer exists."}},{status:404});
    const asset=await prisma.uploadAsset.update({where:{publicId:assetId},data:{assignedUserId:assignedUser?.id??null,...(typeof body?.isRoomBackground==="boolean"?{isRoomBackground:body.isRoomBackground}:{})},include:{assignedUser:{select:{publicId:true,name:true,profileImage:true}}}});
    await prisma.auditLog.create({data:{action:"UPLOAD_ASSET_ASSIGNMENT_UPDATED",category:"CONTENT_MANAGEMENT",entityType:"UploadAsset",entityId:asset.publicId,description:`${session.user.name??"Administrator"} updated assignment for ${asset.name}.`,metadata:{assignedUserId:assignedUserPublicId||null,isRoomBackground:asset.isRoomBackground}}});
    return Response.json({success:true,data:{asset:serializeUploadAsset(asset,`/api/uploads/${asset.publicId}/file`)}});
  } catch(error) {
    if(error?.code==="P2025")return Response.json({success:false,error:{code:"ASSET_NOT_FOUND",message:"Upload not found."}},{status:404});
    console.error("Asset assignment update failed",error);
    return Response.json({success:false,error:{code:"UPDATE_FAILED",message:"Unable to update this upload right now."}},{status:500});
  }
}
