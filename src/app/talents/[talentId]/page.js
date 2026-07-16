import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "../../../../auth";
import ProfileManager from "../../components/profile-manager";
import { prisma } from "../../../lib/prisma";

export default async function TalentProfilePage({params}) {
  const session=await auth(); if(!session?.user) redirect("/");
  const {talentId}=await params;
  const talent=await prisma.talent.findUnique({where:{publicId:decodeURIComponent(talentId)},include:{devices:{orderBy:{lastLoginAt:"desc"},take:1},salaryHistory:{orderBy:{periodEnd:"desc"},take:1}}});
  if(!talent) notFound();
  const device=talent.devices[0];
  const salary=talent.salaryHistory[0];
  const profile={id:talent.publicId,name:talent.displayName,legalName:talent.legalName,type:display(talent.type),email:talent.email,phone:talent.phone ?? "—",country:talent.country ?? "—",status:display(talent.status),verification:display(talent.verification),joined:talent.createdAt.toLocaleDateString("en-US",{month:"short",day:"2-digit",year:"numeric"}),giftsReceived:Number(talent.totalGiftsValue),followers:talent.followers,salary:Number(salary?.amount ?? 0),liveHours:Math.round(talent.liveMinutes/60),lastLogin:device?.lastLoginAt?.toLocaleString("en-US") ?? "Never",ip:device?.lastLoginIp ?? "—",mac:device?.macAddress ?? "—",location:device?.location ?? "Unknown"};
  return <main className="min-h-screen bg-[#f4f8f7] text-[#142c2a]"><header className="border-b border-[#dfe9e7] bg-white px-6 py-5 md:px-10"><div className="mx-auto max-w-7xl"><Link href="/talents" className="text-xs font-bold text-[#087f74]">← Back to Talent Management</Link></div></header><div className="mx-auto max-w-7xl p-6 md:p-10"><div className="mb-7 flex items-center gap-4"><span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#fff1df] text-xl font-bold text-[#a66b20]">{profile.name.split(" ").map((part)=>part[0]).join("")}</span><div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold">{profile.name}</h1><span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">{profile.verification}</span></div><p className="mt-1 text-xs text-[#748782]">{profile.id} · {profile.type}</p></div></div><ProfileManager profile={profile} type="talent"/></div></main>;
}

function display(value) {
  return value.toLowerCase().replaceAll("_"," ").replace(/\b\w/g,(letter)=>letter.toUpperCase());
}
