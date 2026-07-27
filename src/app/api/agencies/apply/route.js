import { prisma } from "../../../../lib/prisma";
import mobileSession from "../../../../lib/mobile-session.cjs";

const maxImageSize=5*1024*1024;
const allowedImageTypes=new Set(["image/jpeg","image/png"]);
const corsHeaders={
  "Access-Control-Allow-Origin":process.env.MOBILE_APP_ORIGIN||"*",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Access-Control-Allow-Headers":"Content-Type, Authorization",
};
const json=(body,status=200)=>Response.json(body,{status,headers:corsHeaders});

export function OPTIONS(){
  return new Response(null,{status:204,headers:corsHeaders});
}

function error(code,message,status,fields){
  return json({success:false,error:{code,message,...(fields?{fields}:{})}},status);
}

function text(form,key,maxLength){
  const value=String(form.get(key)??"").trim();
  return value&&value.length<=maxLength?value:null;
}

function validEmail(value){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function imageData(form,key){
  const file=form.get(key);
  if(!(file instanceof File)||!file.size)return {error:`${key} is required.`};
  if(!allowedImageTypes.has(file.type))return {error:`${key} must be a JPEG or PNG image.`};
  if(file.size>maxImageSize)return {tooLarge:true,error:`${key} cannot exceed 5 MB.`};
  const bytes=Buffer.from(await file.arrayBuffer());
  const isJpeg=file.type==="image/jpeg"&&bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
  const isPng=file.type==="image/png"&&bytes.length>=8&&bytes.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  if(!isJpeg&&!isPng)return {error:`${key} content does not match its image type.`};
  return {bytes,mime:file.type};
}

async function authenticatedUser(request){
  const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
  const payload=mobileSession.verifyMobileSessionToken(token);
  const user=await prisma.user.findUnique({
    where:{publicId:payload.userId},
    select:{id:true,publicId:true,email:true,country:true,deletedAt:true,sessionVersion:true},
  });
  if(!user||user.deletedAt||user.sessionVersion!==payload.sessionVersion)throw new Error("INVALID_SESSION");
  return user;
}

export async function POST(request){
  let user;
  try{
    user=await authenticatedUser(request);
  }catch{
    return error("INVALID_SESSION","The mobile session is invalid or expired.",401);
  }

  let form;
  try{
    form=await request.formData();
  }catch{
    return error("VALIDATION","Request body must be multipart/form-data.",422);
  }

  const agencyName=text(form,"agencyName",120);
  const whatsapp=text(form,"whatsapp",40);
  const bdCode=text(form,"bdCode",50);
  const suppliedEmail=String(form.get("email")??"").trim().toLowerCase();
  const email=user.email?.trim().toLowerCase()||suppliedEmail;
  const fields={};
  if(!agencyName)fields.agencyName="Agency name is required and cannot exceed 120 characters.";
  if(!whatsapp)fields.whatsapp="WhatsApp number is required and cannot exceed 40 characters.";
  if(!bdCode)fields.bdCode="BD code is required and cannot exceed 50 characters.";
  if(!email||!validEmail(email))fields.email="A valid email address is required.";

  const [cnicFront,cnicBack]=await Promise.all([imageData(form,"cnicFront"),imageData(form,"cnicBack")]);
  if(cnicFront.tooLarge||cnicBack.tooLarge)return error("FILE_TOO_LARGE",cnicFront.tooLarge?cnicFront.error:cnicBack.error,413);
  if(cnicFront.error)fields.cnicFront=cnicFront.error;
  if(cnicBack.error)fields.cnicBack=cnicBack.error;
  if(Object.keys(fields).length)return error("VALIDATION","Agency application data is invalid.",422,fields);

  try{
    const existing=await prisma.agencyApplication.findFirst({
      where:{userId:user.id,status:"PENDING"},
      select:{publicId:true},
    });
    if(existing)return error("ALREADY_APPLIED","You already have a pending application.",409);

    const publicId=`AGA-${crypto.randomUUID().replaceAll("-","").slice(0,12).toUpperCase()}`;
    const application=await prisma.$transaction(async(tx)=>{
      const created=await tx.agencyApplication.create({
        data:{
          publicId,
          userId:user.id,
          agencyName,
          email,
          whatsapp,
          bdCode,
          country:user.country,
          cnicFrontData:cnicFront.bytes,
          cnicFrontMime:cnicFront.mime,
          cnicBackData:cnicBack.bytes,
          cnicBackMime:cnicBack.mime,
        },
        select:{publicId:true,status:true},
      });
      await tx.auditLog.create({
        data:{
          action:"AGENCY_APPLICATION_SUBMITTED",
          category:"AGENCY_MANAGEMENT",
          entityType:"AgencyApplication",
          entityId:created.publicId,
          description:`User ${user.publicId} submitted an agency application for ${agencyName}.`,
          metadata:{userId:user.publicId,agencyName,bdCode,country:user.country},
        },
      });
      return created;
    });

    return json({success:true,data:{applicationId:application.publicId,status:application.status}},201);
  }catch(errorValue){
    console.error("Agency application submission failed",errorValue);
    return error("SUBMISSION_FAILED","Unable to submit the agency application right now.",500);
  }
}
