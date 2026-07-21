"use client";

import { useState } from "react";
import { createSpecialIdDefinition, revokeSpecialId } from "../database-actions";
import usePortalData from "../hooks/use-portal-data";

const formatMinutes=(minutes)=>minutes%525600===0?`${minutes/525600} year(s)`:minutes%43200===0?`${minutes/43200} month(s)`:minutes%1440===0?`${minutes/1440} day(s)`:minutes%60===0?`${minutes/60} hour(s)`:`${minutes} minutes`;

export default function SpecialIdAssignments({initialAssignments}){
  const [rows,setRows]=usePortalData(initialAssignments);
  const [selected,setSelected]=useState(null);
  const active=rows.filter((row)=>row.status==="ACTIVE").length;
  return <section className="overflow-hidden rounded-2xl border border-[#dce8e5] bg-white">
    <div className="flex flex-col gap-3 border-b border-[#e5ecea] p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-base font-bold">Special ID assignments</h2><p className="mt-1 text-xs text-[#748782]">{active} active assignment(s). Expired IDs automatically become available to another user.</p></div></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead><tr className="bg-[#f8fbfa] text-[10px] tracking-wider text-[#7b8e89] uppercase"><th className="px-5 py-3.5">Special ID</th><th>User</th><th>Category</th><th>Source</th><th>Status</th><th>Starts</th><th>Expires</th><th className="px-5 text-right">Action</th></tr></thead><tbody className="divide-y divide-[#edf2f1]">{rows.map((row)=><tr key={row.id}><td className="px-5 py-4 font-mono font-bold text-[#087f74]">{row.specialId}</td><td><p className="font-bold">{row.user}</p><p className="text-[10px] text-[#83948f]">Normal ID: {row.userId}</p></td><td>{row.category}</td><td>{row.source}</td><td><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${row.status==="ACTIVE"?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-600"}`}>{row.status}</span></td><td>{row.starts}</td><td>{row.expires}</td><td className="px-5 text-right">{row.status==="ACTIVE"&&<button onClick={()=>setSelected(row)} className="rounded-lg border border-red-200 px-3 py-2 text-[10px] font-bold text-red-600 hover:bg-red-50">Revoke</button>}</td></tr>)}</tbody></table></div>
    {selected&&<ReasonModal title="Revoke Special ID" subtitle={`${selected.specialId} · ${selected.userId}`} confirm="Revoke ID" onClose={()=>setSelected(null)} onSubmit={async(reason)=>{await revokeSpecialId(selected.id,reason);setRows((current)=>current.map((row)=>row.id===selected.id?{...row,status:"REVOKED"}:row));setSelected(null);}}/>}
  </section>;
}

export function SpecialIdCatalog({initialCatalog}){
  const [catalog,setCatalog]=usePortalData(initialCatalog);
  const [creating,setCreating]=useState(false);
  return <section className="overflow-hidden rounded-2xl border border-[#dce8e5] bg-white">
    <div className="flex flex-col gap-3 border-b border-[#e5ecea] p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-base font-bold">VIP &amp; SVIP Special IDs</h2><p className="mt-1 text-xs text-[#748782]">Create 4–7 character IDs and define automatic VIP or top-up eligibility.</p></div><button onClick={()=>setCreating(true)} className="h-10 rounded-lg bg-[#087f74] px-4 text-xs font-bold text-white">Create Special ID</button></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs"><thead><tr className="bg-[#f8fbfa] text-[10px] tracking-wider text-[#7b8e89] uppercase"><th className="px-5 py-3.5">Special ID</th><th>Type</th><th>VIP requirement</th><th>Top-up requirement</th><th>Default time</th><th>Availability</th></tr></thead><tbody className="divide-y divide-[#edf2f1]">{catalog.map((item)=><tr key={item.id}><td className="px-5 py-4 font-mono text-sm font-bold text-[#087f74]">{item.code}</td><td><span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-bold text-amber-700">{item.category}</span></td><td>{item.minimumVipLevel?`VIP ${item.minimumVipLevel}+`:"—"}</td><td>{item.minimumTopUpAmount?`${item.minimumTopUpAmount.toLocaleString()} coins`:"—"}</td><td>{formatMinutes(item.defaultDurationMinutes)}</td><td>{item.assignedTo?<div><span className="font-bold text-amber-700">Assigned</span><p className="text-[10px] text-[#83948f]">{item.assignedTo}</p></div>:<span className="font-bold text-emerald-700">Available</span>}</td></tr>)}</tbody></table></div>
    {creating&&<CreateModal onClose={()=>setCreating(false)} onCreated={(item)=>{setCatalog((current)=>[...current,{...item,assignedTo:null,expiresAt:null}]);setCreating(false);}}/>}
  </section>;
}

function CreateModal({onClose,onCreated}){
  const [error,setError]=useState("");
  return <Modal title="Create Special ID" subtitle="Reusable after a timed assignment expires" onClose={onClose}><form onSubmit={async(e)=>{e.preventDefault();setError("");const f=new FormData(e.currentTarget);try{const item=await createSpecialIdDefinition(Object.fromEntries(f));onCreated(item);}catch(err){setError(err.message);}}} className="grid gap-4">
    <Field label="Special ID (4–7 letters or numbers)"><input name="code" required minLength="4" maxLength="7" pattern="[A-Za-z0-9]{4,7}" className={input} placeholder="VIP777"/></Field>
    <Field label="Category"><select name="category" className={input} defaultValue="VIP"><option>STANDARD</option><option>VIP</option><option>SVIP</option></select></Field>
    <div className="grid grid-cols-2 gap-3"><Field label="Minimum VIP level"><input name="minimumVipLevel" type="number" min="1" max="5" className={input} placeholder="Optional"/></Field><Field label="Minimum top-up"><input name="minimumTopUpAmount" type="number" min="0" className={input} placeholder="Optional coins"/></Field></div>
    <Field label="Default duration (minutes)"><input name="defaultDurationMinutes" required type="number" min="1" defaultValue="10080" className={input}/><p className="mt-1 text-[10px] text-[#82938f]">10,080 minutes = 7 days</p></Field>
    {error&&<p className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}<Actions onClose={onClose} confirm="Create ID"/>
  </form></Modal>;
}

function ReasonModal({title,subtitle,confirm,onClose,onSubmit}){return <Modal title={title} subtitle={subtitle} onClose={onClose}><form onSubmit={(e)=>{e.preventDefault();onSubmit(String(new FormData(e.currentTarget).get("reason")));}}><Field label="Admin reason"><textarea name="reason" required rows="3" className={`${input} h-auto py-3`} placeholder="Explain this action..."/></Field><Actions onClose={onClose} confirm={confirm}/></form></Modal>}
function Modal({title,subtitle,onClose,children}){return <div className="fixed inset-0 z-50 grid place-items-center bg-[#061c1a]/60 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"><div className="flex justify-between border-b border-[#e5ecea] px-6 py-5"><div><h2 className="text-lg font-bold">{title}</h2><p className="mt-1 text-xs text-[#748782]">{subtitle}</p></div><button onClick={onClose} className="text-xl" type="button">×</button></div><div className="p-6">{children}</div></div></div>}
function Field({label,children}){return <label className="block text-xs font-bold">{label}<div className="mt-2">{children}</div></label>}
function Actions({onClose,confirm}){return <div className="mt-6 flex justify-end gap-2 border-t border-[#e8efed] pt-5"><button type="button" onClick={onClose} className="h-10 rounded-lg border px-4 text-xs font-bold">Cancel</button><button className="h-10 rounded-lg bg-[#087f74] px-5 text-xs font-bold text-white">{confirm}</button></div>}
const input="h-11 w-full rounded-lg border border-[#dce6e4] bg-white px-3 text-xs outline-none focus:border-[#2ca89c]";
