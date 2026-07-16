"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../../auth";
import { prisma } from "../lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  const admin = await prisma.admin.findUnique({ where:{email:session.user.email} });
  if (!admin?.active) throw new Error("Unauthorized");
  return admin;
}

async function logActivity(admin, data) {
  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      action: data.action,
      category: data.category,
      entityType: data.entityType,
      entityId: data.entityId,
      description: data.description,
      metadata: data.metadata,
    },
  });
  revalidatePath("/audit-logs");
}

const enumValue = (value) => {
  const normalized=String(value).trim().toUpperCase().replaceAll(" ","_");
  if(normalized==="REVIEW")return "UNDER_REVIEW";
  if(normalized==="VIDEO_&_AUDIO_HOST")return "VIDEO_AND_AUDIO_HOST";
  return normalized;
};

export async function updateUserAccount(publicId, changes) {
  const admin=await requireAdmin();
  const data={};
  if(changes.name!==undefined)data.name=changes.name;
  if(changes.email!==undefined)data.email=changes.email;
  if(changes.phone!==undefined)data.phone=changes.phone;
  if(changes.country!==undefined)data.country=changes.country;
  if(changes.role!==undefined)data.role=enumValue(changes.role);
  if(changes.status!==undefined)data.status=enumValue(changes.status);
  if(changes.vipLevel!==undefined)data.vipLevel=Number(changes.vipLevel);
  await prisma.user.update({where:{publicId},data});
  let action="UPDATE_USER";
  let description=`${admin.name} updated user ${publicId}`;
  if(changes.vipLevel!==undefined) {
    action=Number(changes.vipLevel)>0?"GRANT_VIP":"REMOVE_VIP";
    description=Number(changes.vipLevel)>0?`${admin.name} granted VIP ${changes.vipLevel} to user ${publicId}`:`${admin.name} removed VIP access from user ${publicId}`;
  } else if(changes.role!==undefined) {
    action="CHANGE_USER_ROLE";
    description=`${admin.name} changed the role of user ${publicId} to ${changes.role}`;
  } else if(changes.status!==undefined) {
    action="CHANGE_USER_STATUS";
    description=`${admin.name} changed user ${publicId} status to ${changes.status}`;
  } else if(changes.name!==undefined||changes.email!==undefined||changes.phone!==undefined||changes.country!==undefined) {
    action="EDIT_USER_PROFILE";
    description=`${admin.name} edited profile details for user ${publicId}`;
  }
  await logActivity(admin,{action,category:"USER_MANAGEMENT",entityType:"User",entityId:publicId,description,metadata:{...changes,reason:changes.auditReason||null}});
  revalidatePath("/users"); revalidatePath(`/users/${publicId}`);
}

export async function updateTalentAccount(publicId, changes) {
  const admin=await requireAdmin();
  const talent=await prisma.talent.findUniqueOrThrow({where:{publicId}});
  const data={};
  if(changes.name!==undefined)data.displayName=changes.name;
  if(changes.email!==undefined)data.email=changes.email;
  if(changes.phone!==undefined)data.phone=changes.phone;
  if(changes.country!==undefined)data.country=changes.country;
  if(changes.status!==undefined)data.status=enumValue(changes.status);
  if(changes.verification!==undefined) {
    data.verification=enumValue(changes.verification);
    await prisma.talentVerification.create({data:{talentId:talent.id,reviewedById:admin.id,status:data.verification,reviewedAt:new Date()}});
  }
  if(changes.salary!==undefined) await prisma.salaryHistory.create({data:{talentId:talent.id,adminId:admin.id,periodStart:new Date(new Date().getFullYear(),new Date().getMonth(),1),periodEnd:new Date(),amount:String(changes.salary),status:"PENDING",notes:"Salary adjusted from admin profile"}});
  if(Object.keys(data).length)await prisma.talent.update({where:{publicId},data});
  let action="UPDATE_TALENT";
  let description=`${admin.name} updated talent ${publicId}`;
  if(changes.verification!==undefined) {
    action="CHANGE_TALENT_VERIFICATION";
    description=`${admin.name} changed talent ${publicId} verification to ${changes.verification}`;
  } else if(changes.salary!==undefined) {
    action="ADJUST_TALENT_SALARY";
    description=`${admin.name} adjusted talent ${publicId} salary to ${changes.salary}`;
  } else if(changes.status!==undefined) {
    action="CHANGE_TALENT_STATUS";
    description=`${admin.name} changed talent ${publicId} status to ${changes.status}`;
  } else if(changes.name!==undefined||changes.email!==undefined||changes.phone!==undefined||changes.country!==undefined) {
    action="EDIT_TALENT_PROFILE";
    description=`${admin.name} edited profile details for talent ${publicId}`;
  }
  await logActivity(admin,{action,category:"TALENT_MANAGEMENT",entityType:"Talent",entityId:publicId,description,metadata:{...changes,reason:changes.auditReason||null}});
  revalidatePath("/talents"); revalidatePath(`/talents/${publicId}`);
}

export async function adjustUserCoins(publicId, operation, amount, reason) {
  const admin=await requireAdmin();
  const user=await prisma.user.findUniqueOrThrow({where:{publicId}});
  const value=BigInt(amount);
  const after=operation==="add" ? user.coinBalance+value : user.coinBalance>value ? user.coinBalance-value : 0n;
  await prisma.$transaction([
    prisma.user.update({where:{id:user.id},data:{coinBalance:after}}),
    prisma.coinAdjustment.create({data:{userId:user.id,adminId:admin.id,operation:operation==="add"?"ADD":"REMOVE",amount:value,balanceBefore:user.coinBalance,balanceAfter:after,reason}}),
  ]);
  await logActivity(admin,{action:operation==="add"?"ADD_COINS":"REMOVE_COINS",category:"FINANCE",entityType:"User",entityId:publicId,description:`${admin.name} ${operation==="add"?"added":"removed"} ${amount} coins ${operation==="add"?"to":"from"} user ${publicId}`,metadata:{amount,operation,reason,balanceAfter:Number(after)}});
  revalidatePath("/users"); revalidatePath(`/users/${publicId}`);
  return Number(after);
}

export async function createAccount(type, values) {
  const admin=await requireAdmin();
  if(type==="user") {
    const latest=await prisma.user.findMany({select:{publicId:true}});
    const next=Math.max(1049,...latest.map((item)=>Number(item.publicId.replace(/\D/g,""))||0))+1;
    const publicId=`USR-${next}`;
    await prisma.user.create({data:{publicId,name:values.name,email:values.email,phone:values.phone,country:values.country,status:enumValue(values.status),vipLevel:values.userType==="VIP User"?1:0}});
    await logActivity(admin,{action:"CREATE_USER",category:"USER_MANAGEMENT",entityType:"User",entityId:publicId,description:`${admin.name} created user ${values.name} (${publicId})`,metadata:{email:values.email,country:values.country}});
    revalidatePath("/users");
  } else {
    const latest=await prisma.talent.findMany({select:{publicId:true}});
    const next=Math.max(2099,...latest.map((item)=>Number(item.publicId.replace(/\D/g,""))||0))+1;
    const publicId=`TLT-${next}`;
    await prisma.talent.create({data:{publicId,displayName:values.displayName,legalName:values.name,email:values.email,phone:values.phone,country:values.country,type:enumValue(values.talentType),verification:enumValue(values.verificationStatus),status:"PENDING"}});
    await logActivity(admin,{action:"CREATE_TALENT",category:"TALENT_MANAGEMENT",entityType:"Talent",entityId:publicId,description:`${admin.name} created talent ${values.displayName} (${publicId})`,metadata:{email:values.email,type:values.talentType}});
    revalidatePath("/talents");
  }
}

export async function createBan({publicId,target,reason,durationMinutes,permanent,proofImage}) {
  const admin=await requireAdmin();
  const isTalent=publicId.startsWith("T");
  const owner=isTalent ? await prisma.talent.findUniqueOrThrow({where:{publicId}}) : await prisma.user.findUniqueOrThrow({where:{publicId}});
  let device;
  if(target==="DEVICE") device=await prisma.device.findFirstOrThrow({where:isTalent?{talentId:owner.id}:{userId:owner.id},orderBy:{lastLoginAt:"desc"}});
  const minutes=permanent?null:Number(durationMinutes);
  await prisma.ban.create({data:{target,userId:!isTalent&&target==="USER"?owner.id:null,talentId:isTalent&&target==="USER"?owner.id:null,deviceId:device?.id,adminId:admin.id,reason,proofImage:proofImage||null,durationMinutes:minutes,expiresAt:minutes?new Date(Date.now()+minutes*60000):null}});
  if(target==="DEVICE")await prisma.device.update({where:{id:device.id},data:{isBanned:true}});
  else if(isTalent)await prisma.talent.update({where:{id:owner.id},data:{status:"BANNED"}});
  else await prisma.user.update({where:{id:owner.id},data:{status:"BANNED"}});
  await logActivity(admin,{action:target==="DEVICE"?"BAN_DEVICE":"BAN_ACCOUNT",category:"SECURITY",entityType:isTalent?"Talent":"User",entityId:publicId,description:`${admin.name} banned the ${target.toLowerCase()} for ${isTalent?"talent":"user"} ${publicId}`,metadata:{reason,durationMinutes:minutes,permanent}});
  revalidatePath(isTalent?"/talents":"/users");
}
