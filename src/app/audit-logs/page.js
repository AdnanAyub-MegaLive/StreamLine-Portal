import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "../../../auth";
import { prisma } from "../../lib/prisma";
import FeatureSearch from "../components/feature-search";
import AuditLogTable from "./audit-log-table";

const nav=[["Overview","/home"],["Users / Senders","/users"],["Talent Management","/talents"],["Audit Logs","/audit-logs"],["Live streams","#"],["Reports","#"]];

export default async function AuditLogsPage() {
  const session=await auth(); if(!session?.user)redirect("/");
  const [records,totalToday,securityCount]=await Promise.all([
    prisma.auditLog.findMany({include:{admin:true},orderBy:{createdAt:"desc"},take:250}),
    prisma.auditLog.count({where:{createdAt:{gte:new Date(new Date().setHours(0,0,0,0))}}}),
    prisma.auditLog.count({where:{category:"SECURITY"}}),
  ]);
  const logs=records.map((log)=>({id:log.id,createdAt:log.createdAt.toLocaleString("en-US"),adminName:log.admin?.name??"System",adminEmail:log.admin?.email??"Automated process",category:log.category,action:log.action,entityId:log.entityId,description:log.description,reason:log.metadata&&typeof log.metadata==="object"&&!Array.isArray(log.metadata)?log.metadata.reason??null:null}));
  return <main className="min-h-screen bg-[#f4f8f7] text-[#142c2a]"><aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#092f2d] px-5 py-7 text-white lg:flex"><Link href="/home" className="flex items-center gap-3 px-2 text-xl font-bold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-linear-to-br from-[#48e4ce] to-[#18b7a6] text-[#073d39]">▶</span>streamline</Link><nav className="mt-12 space-y-1">{nav.map(([label,href])=><Link key={label} href={href} className={`block rounded-xl px-4 py-3 text-sm ${href==="/audit-logs"?"bg-white/10 font-semibold text-[#62e0d0]":"text-[#a9c5c1] hover:bg-white/5 hover:text-white"}`}>{label}</Link>)}</nav></aside><section className="lg:pl-64"><header className="flex h-20 items-center gap-6 border-b border-[#dfe9e7] bg-white px-6 md:px-10"><div className="shrink-0"><p className="text-xs font-semibold tracking-widest text-[#16877d] uppercase">System</p><h1 className="text-xl font-bold">Audit Logs</h1></div><FeatureSearch/><div className="ml-auto"><form action={async()=>{"use server";await signOut({redirectTo:"/"});}}><button className="rounded-lg border border-[#d7e4e1] px-4 py-2 text-xs font-semibold">Sign out</button></form></div></header><div className="mx-auto max-w-7xl p-6 md:p-10"><div className="mb-7"><h2 className="text-2xl font-bold">Portal activity history</h2><p className="mt-1.5 text-sm text-[#71847f]">A permanent record of administrative and system activity.</p></div><div className="mb-6 grid gap-3 sm:grid-cols-3">{[["Total records",records.length,"Latest 250 records"],["Activity today",totalToday,"Actions since midnight"],["Security events",securityCount,"Bans and restrictions"]].map(([label,value,note])=><div key={label} className="rounded-xl border border-[#dfe9e7] bg-white p-5"><p className="text-[11px] font-semibold text-[#768984]">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p><p className="mt-2 text-[10px] text-[#429387]">{note}</p></div>)}</div><AuditLogTable logs={logs}/></div></section></main>;
}
