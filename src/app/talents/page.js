import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "../../../auth";
import TalentTabs from "./talent-tabs";
import AddAccountModal from "../components/add-account-modal";
import FeatureSearch from "../components/feature-search";
import { prisma } from "../../lib/prisma";
import { reconcileExpiredBans } from "../../lib/ban-maintenance";

const nav = [["Overview", "/home"], ["Users / Senders", "/users"], ["Talent Management", "/talents"], ["Agency Management", "/agencies"], ["Uploads", "/uploads"], ["Audit Logs", "/audit-logs"], ["Live streams", "#"], ["Reports", "#"]];

export default async function TalentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  await reconcileExpiredBans();
  const [talents, devices] = await Promise.all([
    prisma.talent.findMany({ orderBy:{createdAt:"desc"},include:{verifications:{orderBy:{submittedAt:"desc"}},receivedGifts:{include:{sender:true},orderBy:{createdAt:"desc"}},salaryHistory:{orderBy:{periodStart:"desc"}},liveSessions:{orderBy:{startedAt:"desc"}},performance:{orderBy:{period:"desc"}},violations:{orderBy:{createdAt:"desc"}}} }),
    prisma.device.findMany({ where:{talentId:{not:null}}, include:{talent:true}, orderBy:{lastLoginAt:"desc"} }),
  ]);
  const talentData = talents.map((talent) => [talent.displayName,display(talent.type),talent.publicId,display(talent.verification),Number(talent.totalGiftsValue).toLocaleString(),talent.followers.toLocaleString()]);
  const deviceData = devices.map((device) => ({ userId:device.talent.publicId,userName:device.talent.displayName,ip:device.lastLoginIp ?? "—",mac:device.macAddress,location:device.location ?? "Unknown",loginTime:device.lastLoginAt?.toLocaleString("en-US",{dateStyle:"medium",timeStyle:"medium"})??"Never",isUserBanned:device.talent.status==="BANNED",isDeviceBanned:device.isBanned }));
  const talentModules={
    verification:talents.flatMap((talent)=>talent.verifications.map((item)=>({id:item.id,talentId:talent.publicId,talent:talent.displayName,status:display(item.status),identityFront:item.identityCardFront?"Submitted":"Missing",identityBack:item.identityCardBack?"Submitted":"Missing",profileImage:item.profileImage?"Submitted":"Missing",submitted:item.submittedAt.toLocaleDateString("en-US"),reviewed:item.reviewedAt?.toLocaleDateString("en-US")??"Pending"}))),
    gifts:talents.flatMap((talent)=>talent.receivedGifts.map((item)=>({id:item.id,talentId:talent.publicId,talent:talent.displayName,senderId:item.sender.publicId,sender:item.sender.name,gift:item.giftName,quantity:item.quantity,value:Number(item.coinValue).toLocaleString(),received:item.createdAt.toLocaleString("en-US")}))),
    salaries:talents.flatMap((talent)=>talent.salaryHistory.map((item)=>({id:item.id,talentId:talent.publicId,talent:talent.displayName,period:`${item.periodStart.toLocaleDateString("en-US")} – ${item.periodEnd.toLocaleDateString("en-US")}`,amount:`${item.currency} ${Number(item.amount).toLocaleString()}`,status:item.status,paid:item.paidAt?.toLocaleDateString("en-US")??"—",notes:item.notes??"—"}))),
    liveHistory:talents.flatMap((talent)=>talent.liveSessions.map((item)=>({id:item.id,talentId:talent.publicId,talent:talent.displayName,room:item.roomId,type:item.streamType,started:item.startedAt.toLocaleString("en-US"),duration:item.endedAt?`${Math.round((item.endedAt-item.startedAt)/60000)} min`:"Live",peakViewers:item.peakViewers,gifts:Number(item.giftsValue).toLocaleString(),status:item.status}))),
    performance:talents.flatMap((talent)=>talent.performance.map((item)=>({id:item.id,talentId:talent.publicId,talent:talent.displayName,period:item.period,liveMinutes:item.liveMinutes.toLocaleString(),viewers:item.uniqueViewers.toLocaleString(),followers:item.newFollowers.toLocaleString(),gifts:Number(item.giftsValue).toLocaleString(),engagement:`${Number(item.engagementRate)}%`}))),
    violations:talents.flatMap((talent)=>talent.violations.map((item)=>({id:item.id,talentId:talent.publicId,talent:talent.displayName,category:item.category.replaceAll("_"," "),severity:item.severity,description:item.description,status:item.status,action:item.actionTaken??"—",reported:item.createdAt.toLocaleDateString("en-US")}))),
  };
  return <main className="min-h-screen bg-[#f4f8f7] text-[#142c2a]">
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#092f2d] px-5 py-7 text-white lg:flex"><Link href="/home" className="flex items-center gap-3 px-2 text-xl font-bold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-linear-to-br from-[#48e4ce] to-[#18b7a6] text-[#073d39]">▶</span>streamline</Link><nav className="mt-12 space-y-1">{nav.map(([label,href]) => <Link key={label} href={href} className={`block rounded-xl px-4 py-3 text-sm ${label === "Talent Management" ? "bg-white/10 font-semibold text-[#62e0d0]" : "text-[#a9c5c1] hover:bg-white/5 hover:text-white"}`}>{label}</Link>)}</nav><div className="mt-auto border-t border-white/10 pt-5 text-xs text-[#82a6a1]">Streamline Admin<br/>Control center</div></aside>
    <section className="lg:pl-64"><header className="flex h-20 items-center gap-6 border-b border-[#dfe9e7] bg-white px-6 md:px-10"><div className="shrink-0"><p className="text-xs font-semibold tracking-widest text-[#16877d] uppercase">Management</p><h1 className="text-xl font-bold">Talents</h1></div><FeatureSearch /><div className="ml-auto flex items-center gap-4"><div className="hidden text-right sm:block"><p className="text-sm font-semibold">{session.user.name}</p><p className="text-xs text-[#718580]">{session.user.email}</p></div><form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><button className="rounded-lg border border-[#d7e4e1] px-4 py-2 text-xs font-semibold text-[#526b67] hover:bg-[#f1f7f5]">Sign out</button></form></div></header>
      <div className="mx-auto max-w-7xl p-6 md:p-10"><div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-bold">Talent management</h2><p className="mt-1.5 text-sm text-[#71847f]">Manage video streamers, audio-room hosts, verification, and earnings.</p></div><AddAccountModal type="talent" /></div><TalentTabs initialTalents={talentData} devices={deviceData} modules={talentModules} /></div>
    </section>
  </main>;
}

function display(value) {
  return value.toLowerCase().replaceAll("_"," ").replace(/\b\w/g,(letter)=>letter.toUpperCase());
}
