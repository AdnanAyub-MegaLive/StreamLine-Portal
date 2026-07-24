"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

const tabs = ["Agency Home", "Agency Tasks", "Monthly Salary", "Talent Salaries", "Agency Apply"];
const agencies = [
  { rank:1,id:"AG-1008",name:"Starlight Network",talents:84,gifts:"8.42M",target:"112%",status:"Achieved" },
  { rank:2,id:"AG-1014",name:"Royal Creators",talents:67,gifts:"7.18M",target:"96%",status:"On track" },
  { rank:3,id:"AG-1003",name:"Moon Media",talents:58,gifts:"6.45M",target:"88%",status:"On track" },
  { rank:4,id:"AG-1021",name:"Voice Hub",talents:49,gifts:"4.92M",target:"71%",status:"At risk" },
];
const topTalents = [
  { rank:1,id:"TL-2048",name:"Aisha Khan",agency:"Starlight Network",gifts:"1.42M",target:"118%" },
  { rank:2,id:"TL-2091",name:"Maya Stone",agency:"Royal Creators",gifts:"1.19M",target:"104%" },
  { rank:3,id:"TL-2088",name:"Aiden Brooks",agency:"Moon Media",gifts:"984K",target:"92%" },
  { rank:4,id:"TL-2112",name:"Zara Ali",agency:"Voice Hub",gifts:"876K",target:"87%" },
];

export default function AgencyTabs() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab");
  const [active,setActive] = useState(tabs.includes(requested) ? requested : tabs[0]);
  return <><div className="mb-7 overflow-x-auto border-b border-[#dce7e4]" role="tablist" aria-label="Agency management sections"><div className="flex min-w-max gap-1">{tabs.map((tab)=><button key={tab} type="button" onClick={()=>setActive(tab)} className={`relative px-4 py-3 text-xs font-semibold transition ${active===tab?"text-[#087f74] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#087f74]":"text-[#71847f] hover:text-[#294a45]"}`} role="tab" aria-selected={active===tab}>{tab}</button>)}</div></div><section role="tabpanel">{active === "Agency Home" ? <AgencyHome/> : <Module tab={active}/>}</section></>;
}

function AgencyHome() {
  return <div className="space-y-6"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[["Total agencies","42","38 currently active"],["Agency talents","1,284","Across all agencies"],["Total agency recharge","PKR 48.6M","Recharge by all agencies"],["Monthly gifts","27.8M","104% of target"],["Pending applications","8","Awaiting review"]].map(([label,value,note])=><div key={label} className="rounded-xl border border-[#dfe9e7] bg-white p-5"><p className="text-[11px] font-semibold text-[#768984]">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p><p className="mt-2 text-[10px] text-[#429387]">{note}</p></div>)}</div><div className="grid gap-6 xl:grid-cols-2"><AgencyTable/><TalentTable/></div></div>;
}

function AgencyTable() {
  return <Card title="Agency ranking" description="Ranked by current-month gift performance"><table className="w-full min-w-[620px] text-left text-xs"><thead><tr className="bg-[#f8fbfa] text-[10px] tracking-wider text-[#7b8e89] uppercase"><th className="px-5 py-3.5">Rank</th><th>Agency</th><th>Talents</th><th>Gifts</th><th>Target</th><th className="pr-5">Status</th></tr></thead><tbody className="divide-y divide-[#edf2f1]">{agencies.map((item)=><tr key={item.id} className="hover:bg-[#f9fcfb]"><td className="px-5 py-4 font-bold text-[#087f74]">#{item.rank}</td><td><strong className="block">{item.name}</strong><span className="text-[9px] text-[#849691]">{item.id}</span></td><td>{item.talents}</td><td className="font-semibold">{item.gifts}</td><td>{item.target}</td><td className="pr-5"><Status value={item.status}/></td></tr>)}</tbody></table></Card>;
}

function TalentTable() {
  return <Card title="Top talents" description="Performance and agency target contribution"><table className="w-full min-w-[580px] text-left text-xs"><thead><tr className="bg-[#f8fbfa] text-[10px] tracking-wider text-[#7b8e89] uppercase"><th className="px-5 py-3.5">Rank</th><th>Talent</th><th>Agency</th><th>Gifts</th><th className="pr-5">Target</th></tr></thead><tbody className="divide-y divide-[#edf2f1]">{topTalents.map((item)=><tr key={item.id} className="hover:bg-[#f9fcfb]"><td className="px-5 py-4 font-bold text-[#087f74]">#{item.rank}</td><td><strong className="block">{item.name}</strong><span className="text-[9px] text-[#849691]">{item.id}</span></td><td>{item.agency}</td><td className="font-semibold">{item.gifts}</td><td className="pr-5">{item.target}</td></tr>)}</tbody></table></Card>;
}

function Module({ tab }) {
  const copy = {
    "Agency Tasks":["Agency tasks","Create and review agency targets, deadlines, and completion status."],
    "Monthly Salary":["Monthly agency salary","Review monthly agency commissions and payment status."],
    "Talent Salaries":["Talent salaries","Review salary calculations for talents working under each agency."],
    "Agency Apply":["Agency applications","Review applications to create or register a new agency."],
  }[tab];
  return <div className="rounded-2xl border border-[#dce8e5] bg-white p-8"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#e4f6f3] text-lg font-bold text-[#087f74]">{tab[0]}</span><h3 className="mt-5 text-lg font-bold">{copy[0]}</h3><p className="mt-2 max-w-2xl text-sm text-[#71847f]">{copy[1]}</p><div className="mt-8 rounded-xl border border-dashed border-[#cbded9] bg-[#f8fbfa] px-6 py-12 text-center text-xs text-[#81938e]">This module is ready for its database workflow and management actions.</div></div>;
}

function Card({ title,description,children }) { return <div className="overflow-hidden rounded-2xl border border-[#dce8e5] bg-white"><div className="border-b border-[#e6eeec] px-5 py-4"><h3 className="text-sm font-bold">{title}</h3><p className="mt-0.5 text-[10px] text-[#849590]">{description}</p></div><div className="overflow-x-auto">{children}</div></div>; }
function Status({ value }) { return <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${value==="At risk"?"bg-rose-50 text-rose-700":value==="Achieved"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{value}</span>; }
