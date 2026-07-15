"use client";

import { useState } from "react";
import UsersTable from "./users-table";
import DeviceInformationTable from "../components/device-information-table";

const tabs = ["User List", "Gift Sending History", "Device Information", "Blocked or Banned User", "User Level", "User Album", "Special ID", "User Top History", "Game logs"];
const stats = [["Total users", "1,248", "+12.5% this month"], ["Active today", "842", "67.4% of users"], ["New this week", "126", "+18 from last week"], ["VIP users", "86", "6.8% of users"]];

export default function ManagementTabs() {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  return <>
    <div className="mb-7 overflow-x-auto border-b border-[#dce7e4]" role="tablist" aria-label="User management sections"><div className="flex min-w-max gap-1">{tabs.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`relative px-4 py-3 text-xs font-semibold transition ${activeTab === tab ? "text-[#087f74] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#087f74]" : "text-[#71847f] hover:text-[#294a45]"}`} role="tab" aria-selected={activeTab === tab}>{tab}</button>)}</div></div>
    <section role="tabpanel">
      {activeTab === "User List" ? <><div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, note]) => <div key={label} className="rounded-xl border border-[#dfe9e7] bg-white p-5"><p className="text-[11px] font-semibold text-[#768984]">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p><p className="mt-2 text-[10px] text-[#429387]">{note}</p></div>)}</div><UsersTable /></> : activeTab === "Device Information" ? <DeviceInformationTable title="User Device Information" /> : <div className="rounded-2xl border border-[#dce8e5] bg-white p-8 shadow-[0_8px_30px_rgba(15,65,60,.04)]"><h3 className="text-xl font-bold text-[#142c2a]">{activeTab}</h3></div>}
    </section>
  </>;
}
