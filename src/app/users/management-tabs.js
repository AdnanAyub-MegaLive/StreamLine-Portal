"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import UsersTable from "./users-table";
import DeviceInformationTable from "../components/device-information-table";
import GiftHistoryTable from "./gift-history-table";
import BlockedUsersTable from "./blocked-users-table";

const tabs = ["User List", "Gift Sending History", "Device Information", "Blocked and Banned User", "User Level", "User Album", "Special ID", "User Top History", "Game logs"];
export default function ManagementTabs({ users, devices }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabs.includes(requestedTab) ? requestedTab : tabs[0]);
  useEffect(()=>{const timer=setInterval(()=>router.refresh(),60000);return()=>clearInterval(timer);},[router]);
  const activeUsers=users.filter((user)=>user.status==="Active").length;
  const vipUsers=users.filter((user)=>user.vipLevel>0).length;
  const stats=[["Total users",users.length,"Stored accounts"],["Active users",activeUsers,`${users.length ? Math.round(activeUsers/users.length*100) : 0}% of users`],["Device records",devices.length,"Application login devices"],["VIP users",vipUsers,`${users.length ? Math.round(vipUsers/users.length*100) : 0}% of users`]];
  return <>
    <div className="mb-7 overflow-x-auto border-b border-[#dce7e4]" role="tablist" aria-label="User management sections"><div className="flex min-w-max gap-1">{tabs.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`relative px-4 py-3 text-xs font-semibold transition ${activeTab === tab ? "text-[#087f74] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#087f74]" : "text-[#71847f] hover:text-[#294a45]"}`} role="tab" aria-selected={activeTab === tab}>{tab}</button>)}</div></div>
    <section role="tabpanel">
      {activeTab === "User List" ? <><div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, note]) => <div key={label} className="rounded-xl border border-[#dfe9e7] bg-white p-5"><p className="text-[11px] font-semibold text-[#768984]">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p><p className="mt-2 text-[10px] text-[#429387]">{note}</p></div>)}</div><UsersTable initialData={users} /></> : activeTab === "Gift Sending History" ? <GiftHistoryTable initialData={users} /> : activeTab === "Device Information" ? <DeviceInformationTable title="User Device Information" records={devices} /> : activeTab === "Blocked and Banned User" ? <BlockedUsersTable initialUsers={users} initialDevices={devices}/> : <div className="rounded-2xl border border-[#dce8e5] bg-white p-8 shadow-[0_8px_30px_rgba(15,65,60,.04)]"><h3 className="text-xl font-bold text-[#142c2a]">{activeTab}</h3></div>}
    </section>
  </>;
}
