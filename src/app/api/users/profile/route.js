import { prisma } from "../../../../lib/prisma";
import mobileSession from "../../../../lib/mobile-session.cjs";
import { getEffectiveUserId, reconcileExpiredSpecialIds } from "../../../../lib/special-id";

const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.MOBILE_APP_ORIGIN || "*",
  "Access-Control-Allow-Methods": "PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
const json = (body,status=200) => Response.json(body,{status,headers:corsHeaders});

export function OPTIONS() {
  return new Response(null,{status:204,headers:corsHeaders});
}

function optionalString(body,key,{lowercase=false,normalizePhone=false}={}) {
  if(!Object.hasOwn(body,key))return undefined;
  if(body[key]===null)return null;
  if(typeof body[key]!=="string")return undefined;
  let value=body[key].trim();
  if(normalizePhone)value=value.replace(/[\s().-]/g,"");
  if(lowercase)value=value.toLowerCase();
  return value||null;
}

export async function PATCH(request) {
  let body;
  try { body=await request.json(); }
  catch { return json({success:false,error:{code:"INVALID_JSON",message:"Request body must be valid JSON."}},400); }

  try {
    const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
    const payload=mobileSession.verifyMobileSessionToken(token);
    const current=await prisma.user.findUnique({where:{publicId:payload.userId}});
    if(!current||current.deletedAt||current.sessionVersion!==payload.sessionVersion)throw new Error("INVALID_SESSION");

    const data={};
    const name=optionalString(body,"name");
    const phone=optionalString(body,"phone",{normalizePhone:true});
    const email=optionalString(body,"email",{lowercase:true});
    const country=optionalString(body,"country");
    const profileImage=optionalString(body,"profileImage");
    const gender=optionalString(body,"gender");
    if(name!==undefined)data.name=name;
    if(phone!==undefined)data.phone=phone;
    if(email!==undefined)data.email=email;
    if(country!==undefined)data.country=country;
    if(profileImage!==undefined)data.profileImage=profileImage;
    if(gender!==undefined)data.gender=gender;

    if(!Object.keys(data).length)return json({success:false,error:{code:"NO_PROFILE_CHANGES",message:"No supported profile fields were supplied."}},422);
    if(data.name===null||data.phone===null)return json({success:false,error:{code:"VALIDATION_ERROR",message:"Name and phone cannot be empty."}},422);

    const user=await prisma.user.update({where:{id:current.id},data});
    await reconcileExpiredSpecialIds();
    const identity=await getEffectiveUserId(user.id,user.publicId);
    return json({success:true,data:{user:{id:identity.effectiveId,normalId:identity.normalId,specialId:identity.specialId,specialIdExpiresAt:identity.specialIdExpiresAt?.toISOString()??null,name:user.name,phone:user.phone,email:user.email,country:user.country,profileImage:user.profileImage,gender:user.gender,role:user.role,status:user.status,vipLevel:user.vipLevel,createdAt:user.createdAt.toISOString(),updatedAt:user.updatedAt.toISOString()}}});
  } catch(error) {
    if(error?.code==="P2002"){
      const fields=Array.isArray(error.meta?.target)?error.meta.target.join(" "):String(error.meta?.target??"");
      const phoneConflict=fields.includes("phone");
      return json({success:false,error:{code:phoneConflict?"PHONE_ALREADY_REGISTERED":"EMAIL_ALREADY_REGISTERED",message:phoneConflict?"A user with this phone number already exists.":"A user with this email address already exists."}},409);
    }
    return json({success:false,error:{code:"INVALID_SESSION",message:"The mobile session is invalid or expired."}},401);
  }
}
