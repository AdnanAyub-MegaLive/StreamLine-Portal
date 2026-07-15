"use client";

import { useMemo, useState } from "react";

const users = [
  ["USR-1048", "Olivia Martin", "olivia@example.com", "OM", "Creator", "Active", "Jul 12, 2026", 48, true, "bg-teal-50 text-teal-700"],
  ["USR-1047", "Jackson Lee", "jackson@example.com", "JL", "Listener", "Active", "Jul 11, 2026", 0, false, "bg-indigo-50 text-indigo-700"],
  ["USR-1046", "Sophia Brown", "sophia@example.com", "SB", "Host", "Active", "Jul 10, 2026", 31, true, "bg-orange-50 text-orange-700"],
  ["USR-1045", "Noah Williams", "noah@example.com", "NW", "Listener", "Suspended", "Jul 08, 2026", 0, false, "bg-purple-50 text-purple-700"],
  ["USR-1044", "Emma Wilson", "emma@example.com", "EW", "Creator", "Active", "Jul 05, 2026", 22, true, "bg-rose-50 text-rose-700"],
  ["USR-1043", "Liam Davis", "liam@example.com", "LD", "Host", "Pending", "Jul 03, 2026", 7, false, "bg-sky-50 text-sky-700"],
].map(([id, name, email, initials, role, status, joined, streams, vip, color]) => ({ id, name, email, initials, role, status, joined, streams, vip, color }));

const statusStyles = { Active: "bg-emerald-50 text-emerald-700", Pending: "bg-amber-50 text-amber-700", Suspended: "bg-red-50 text-red-700" };

export default function UsersTable() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [userType, setUserType] = useState("All");
  const filtered = useMemo(() => users.filter((user) => `${user.name} ${user.email} ${user.id}`.toLowerCase().includes(query.toLowerCase()) && (status === "All" || user.status === status) && (userType === "All" || user.vip)), [query, status, userType]);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#dce8e5] bg-white shadow-[0_8px_30px_rgba(15,65,60,.04)]">
      <div className="flex flex-col gap-3 border-b border-[#e5ecea] p-5 sm:flex-row sm:justify-between">
        <div className="relative w-full sm:max-w-xs"><svg className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 fill-none stroke-[#80938f] stroke-2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input value={query} onChange={(e) => setQuery(e.target.value)} className="h-10 w-full rounded-lg border border-[#dce6e4] bg-[#fafcfc] pr-3 pl-10 text-xs outline-none placeholder:text-[#9aa9a6] focus:border-[#2ca89c] focus:ring-3 focus:ring-[#2ca89c]/10" placeholder="Search users, email or ID..." aria-label="Search users" /></div>
        <div className="flex gap-2"><select value={userType} onChange={(e) => setUserType(e.target.value)} className="h-10 rounded-lg border border-[#dce6e4] bg-white px-3 text-xs font-medium text-[#536863] outline-none" aria-label="Filter VIP users"><option value="All">All users</option><option value="VIP">VIP users</option></select><select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border border-[#dce6e4] bg-white px-3 text-xs font-medium text-[#536863] outline-none" aria-label="Filter by status"><option value="All">All statuses</option><option>Active</option><option>Pending</option><option>Suspended</option></select></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left"><thead><tr className="bg-[#f8fbfa] text-[10px] tracking-wider text-[#7b8e89] uppercase"><th className="w-12 px-5 py-3.5"><input type="checkbox" className="accent-[#087f74]" aria-label="Select all" /></th><th>User</th><th>Role</th><th>VIP</th><th>Status</th><th>Joined</th><th>Streams</th><th className="px-5 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-[#edf2f1]">{filtered.map((user) => <tr key={user.id} className="hover:bg-[#f9fcfb]"><td className="px-5 py-4"><input type="checkbox" className="accent-[#087f74]" aria-label={`Select ${user.name}`} /></td><td className="py-4"><div className="flex items-center gap-3"><span className={`grid h-9 w-9 place-items-center rounded-full text-[11px] font-bold ${user.color}`}>{user.initials}</span><div><p className="text-xs font-bold">{user.name}</p><p className="text-[10px] text-[#849590]">{user.email} · {user.id}</p></div></div></td><td className="py-4 text-xs text-[#526963]">{user.role}</td><td>{user.vip ? <span className="rounded-full bg-[#fff7df] px-2 py-1 text-[9px] font-bold text-[#a66b00]">VIP</span> : <span className="text-xs text-[#a1afac]">—</span>}</td><td><span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold ${statusStyles[user.status]}`}><i className="h-1.5 w-1.5 rounded-full bg-current" />{user.status}</span></td><td className="text-xs text-[#667b76]">{user.joined}</td><td className="text-xs font-semibold">{user.streams}</td><td className="px-5 text-right"><button className="rounded-lg p-2 text-[#7d908b] hover:bg-[#edf5f3]" aria-label={`Actions for ${user.name}`}>•••</button></td></tr>)}</tbody>
        </table>
        {!filtered.length && <div className="py-16 text-center text-sm text-[#788b87]">No users match your search.</div>}
      </div>
      <div className="flex items-center justify-between border-t border-[#e8efed] px-5 py-4 text-[11px] text-[#788b87]"><span>Showing {filtered.length} of 1,248 users</span><div className="flex gap-1"><button className="rounded-md border border-[#dce6e4] px-2.5 py-1.5 opacity-40">Previous</button><button className="rounded-md bg-[#087f74] px-2.5 py-1.5 font-bold text-white">1</button><button className="rounded-md px-2.5 py-1.5">2</button><button className="rounded-md border border-[#dce6e4] px-2.5 py-1.5">Next</button></div></div>
    </div>
  );
}
