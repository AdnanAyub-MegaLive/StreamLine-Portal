import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "../../../../auth";
import ProfileManager from "../../components/profile-manager";
import { prisma } from "../../../lib/prisma";

export default async function UserProfilePage({params}) {
  const session=await auth(); if(!session?.user) redirect("/");
  const {userId}=await params;
  const user=await prisma.user.findFirst({where:{publicId:decodeURIComponent(userId),deletedAt:null},include:{devices:{orderBy:{lastLoginAt:"desc"},take:1},assignedUploads:{select:{publicId:true,name:true,category:true,fileName:true,mimeType:true,fileSize:true,isRoomBackground:true,createdAt:true},orderBy:{createdAt:"desc"}},_count:{select:{sentGifts:true}}}});
  if(!user) notFound();
  const device=user.devices[0];
  const profile={id:user.publicId,name:user.name,email:user.email,phone:user.phone,country:user.country ?? "—",gender:user.gender?display(user.gender):"Not set",dob:user.dob?.toISOString().slice(0,10)??"Not set",role:display(user.role),status:display(user.status),vipLevel:user.vipLevel,joined:user.createdAt.toLocaleDateString("en-US",{month:"short",day:"2-digit",year:"numeric"}),totalSpent:Number(user.totalSpent),balance:Number(user.coinBalance),gifts:user._count.sentGifts,lastLogin:device?.lastLoginAt?.toLocaleString("en-US") ?? "Never",ip:device?.lastLoginIp ?? "—",mac:device?.macAddress ?? "—",location:device?.location ?? "Unknown",assignedAssets:user.assignedUploads.map((asset)=>({id:asset.publicId,name:asset.name,category:display(asset.category),fileName:asset.fileName,mimeType:asset.mimeType,fileSize:asset.fileSize,isRoomBackground:asset.isRoomBackground,assignedAt:asset.createdAt.toLocaleDateString("en-US",{month:"short",day:"2-digit",year:"numeric"}),url:`/api/uploads/${asset.publicId}/file`}))};
  return <main className="min-h-screen bg-[#f4f8f7] text-[#142c2a]"><header className="border-b border-[#dfe9e7] bg-white px-6 py-5 md:px-10"><div className="mx-auto max-w-7xl"><Link href="/users" className="text-xs font-bold text-[#087f74]">← Back to Users / Senders</Link></div></header><div className="mx-auto max-w-7xl p-6 md:p-10"><div className="mb-7 flex items-center gap-4"><span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#dff5f1] text-xl font-bold text-[#087f74]">{profile.name.split(" ").map((part)=>part[0]).join("")}</span><div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold">{profile.name}</h1><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${profile.status==="Active"?"bg-emerald-50 text-emerald-700":"bg-red-50 text-red-700"}`}>{profile.status}</span></div><p className="mt-1 text-xs text-[#748782]">{profile.id} · {profile.phone}{profile.email?` · ${profile.email}`:""}</p></div></div><ProfileManager profile={profile} type="user"/></div></main>;
}

function display(value) {
  return value.toLowerCase().replaceAll("_"," ").replace(/\b\w/g,(letter)=>letter.toUpperCase());
}
