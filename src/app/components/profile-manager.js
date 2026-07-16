"use client";

import { useState } from "react";
import { adjustUserCoins, updateTalentAccount, updateUserAccount } from "../database-actions";

const format = new Intl.NumberFormat("en-US");

export default function ProfileManager({ profile, type }) {
  const isTalent = type === "talent";
  const [data,setData] = useState(profile);
  const [modal,setModal] = useState(null);
  const stats = isTalent ? [["Gifts received",`${format.format(data.giftsReceived)} coins`],["Followers",format.format(data.followers)],["Monthly salary",`$${format.format(data.salary)}`],["Live hours",`${data.liveHours} hrs`]] : [["Total spending",`${format.format(data.totalSpent)} coins`],["Current balance",`${format.format(data.balance)} coins`],["Gifts sent",format.format(data.gifts)],["VIP level",data.vipLevel ? `VIP ${data.vipLevel}` : "None"]];

  return <>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label,value]) => <div key={label} className="rounded-xl border border-[#dfe9e7] bg-white p-5"><p className="text-[11px] font-semibold text-[#768984]">{label}</p><p className="mt-2 text-xl font-bold">{value}</p></div>)}</div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_.7fr]">
      <section className="rounded-2xl border border-[#dce8e5] bg-white p-6"><div className="flex items-center justify-between border-b border-[#edf2f1] pb-4"><h2 className="text-base font-bold">Account information</h2><button onClick={() => setModal("edit")} className="rounded-lg border border-[#cfe1de] px-3 py-2 text-[10px] font-bold text-[#087f74]">Edit details</button></div><dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">{(isTalent ? [["Display name",data.name],["Legal name",data.legalName],["Talent ID",data.id],["Talent type",data.type],["Email",data.email],["Phone",data.phone],["Country",data.country],["Joined",data.joined]] : [["Full name",data.name],["User ID",data.id],["Email",data.email],["Phone",data.phone],["Country",data.country],["Role",data.role],["Status",data.status],["Joined",data.joined]]).map(([label,value]) => <div key={label}><dt className="text-[10px] font-bold tracking-wider text-[#899994] uppercase">{label}</dt><dd className="mt-1.5 text-xs font-semibold text-[#304944]">{value}</dd></div>)}</dl></section>
      <section className="rounded-2xl border border-[#dce8e5] bg-white p-6"><h2 className="border-b border-[#edf2f1] pb-4 text-base font-bold">Management actions</h2><div className="mt-5 grid gap-2">{isTalent ? <><Action text="Update verification" onClick={() => setModal("verification")}/><Action text="Adjust salary" onClick={() => setModal("salary")}/><Action text="Change talent status" onClick={() => setModal("status")}/></> : <><Action text="Adjust role" onClick={() => setModal("role")}/><Action text="Manage VIP level" onClick={() => setModal("vip")}/><Action text="Add / Remove coins" onClick={() => setModal("coins")}/><Action text="Change account status" onClick={() => setModal("status")}/></>}</div></section>
    </div>
    <section className="mt-6 rounded-2xl border border-[#dce8e5] bg-white p-6"><h2 className="text-base font-bold">Device and login information</h2><div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{[["Last login",data.lastLogin || "Jul 16, 2026 · 09:42 AM"],["Last login IP",data.ip],["MAC address",data.mac],["Location",data.location]].map(([label,value]) => <div key={label}><p className="text-[10px] font-bold tracking-wider text-[#899994] uppercase">{label}</p><p className="mt-1.5 break-all text-xs font-semibold text-[#304944]">{value}</p></div>)}</div></section>
    {modal && <ManageModal type={modal} profile={data} isTalent={isTalent} onClose={() => setModal(null)} onSave={async (updates) => {
      if(updates.coinAdjustment) {
        const balance=await adjustUserCoins(data.id,updates.coinAdjustment.operation,updates.coinAdjustment.amount,updates.coinAdjustment.reason);
        setData((current)=>({...current,balance}));
      } else {
        await (isTalent ? updateTalentAccount(data.id,updates) : updateUserAccount(data.id,updates));
        setData((current) => ({...current,...updates}));
      }
      setModal(null);
    }}/>}
  </>;
}

function Action({text,onClick}) { return <button onClick={onClick} className="flex items-center justify-between rounded-xl border border-[#e0eae8] px-4 py-3 text-left text-xs font-semibold text-[#405853] hover:border-[#add3cd] hover:bg-[#f4f9f8]">{text}<span>→</span></button>; }

function ManageModal({type,profile,isTalent,onClose,onSave}) {
  const [value,setValue] = useState(type === "vip" ? profile.vipLevel : type === "role" ? profile.role : type === "status" ? profile.status : type === "verification" ? profile.verification : "");
  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const auditReason=String(form.get("reason")||"");
    if(type === "vip") onSave({vipLevel:Number(value),auditReason});
    else if(type === "role") onSave({role:value,auditReason});
    else if(type === "status") onSave({status:value,auditReason});
    else if(type === "verification") onSave({verification:value,auditReason});
    else if(type === "salary") onSave({salary:Number(value),auditReason});
    else if(type === "coins") onSave({coinAdjustment:{operation:form.get("operation"),amount:Number(form.get("amount")),reason:form.get("reason")}});
    else if(type === "edit") onSave({name:form.get("name"),email:form.get("email"),phone:form.get("phone"),country:form.get("country")});
  }
  const titles={edit:"Edit account details",role:"Adjust user role",vip:"Manage VIP level",coins:"Manage coin balance",status:"Change account status",verification:"Update verification",salary:"Adjust salary"};
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#061c1a]/60 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-[470px] rounded-2xl bg-white shadow-2xl"><div className="flex justify-between border-b border-[#e5ecea] px-6 py-5"><div><h2 className="text-lg font-bold">{titles[type]}</h2><p className="mt-1 text-xs text-[#748782]">{profile.name} · {profile.id}</p></div><button onClick={onClose} className="text-xl">×</button></div><form onSubmit={submit} className="p-6">{type === "edit" ? <div className="grid gap-4"><Input name="name" label={isTalent ? "Display name" : "Full name"} value={profile.name}/><Input name="email" label="Email" value={profile.email} type="email"/><Input name="phone" label="Phone" value={profile.phone}/><Input name="country" label="Country" value={profile.country}/></div> : type === "coins" ? <><Select label="Operation" name="operation" options={["add","remove"]}/><Input label="Coin amount" name="amount" type="number"/><Reason/></> : <><label className="mb-2 block text-xs font-bold">New value</label>{type === "salary" ? <input value={value} onChange={(e)=>setValue(e.target.value)} type="number" min="0" required className="h-11 w-full rounded-lg border border-[#dce6e4] px-3 text-xs"/> : <select value={value} onChange={(e)=>setValue(e.target.value)} className="h-11 w-full rounded-lg border border-[#dce6e4] bg-white px-3 text-xs">{(type === "vip" ? [0,1,2,3,4,5] : type === "role" ? ["Listener","Sender","Creator","Host","Moderator"] : type === "verification" ? ["Pending","Review","Verified","Rejected"] : ["Active","Pending","Suspended","Banned"]).map((option)=><option key={option} value={option}>{type === "vip" ? option ? `VIP ${option}` : "Remove VIP" : option}</option>)}</select>}<Reason/></>}<div className="mt-6 flex justify-end gap-2 border-t border-[#e8efed] pt-5"><button type="button" onClick={onClose} className="h-10 rounded-lg border px-4 text-xs font-bold">Cancel</button><button className="h-10 rounded-lg bg-[#087f74] px-5 text-xs font-bold text-white">Save changes</button></div></form></div></div>;
}
function Input({label,name,value,type="text"}) { return <label className="text-xs font-bold">{label}<input name={name} type={type} defaultValue={value} required min={type==="number" ? 1 : undefined} className="mt-2 h-11 w-full rounded-lg border border-[#dce6e4] px-3 text-xs font-normal"/></label>; }
function Select({label,name,options}) { return <label className="mb-4 block text-xs font-bold">{label}<select name={name} className="mt-2 h-11 w-full rounded-lg border border-[#dce6e4] bg-white px-3 text-xs font-normal">{options.map((option)=><option key={option}>{option}</option>)}</select></label>; }
function Reason() { return <label className="mt-4 block text-xs font-bold">Reason<textarea name="reason" required rows="3" className="mt-2 w-full resize-none rounded-lg border border-[#dce6e4] p-3 text-xs font-normal" placeholder="Explain this change..."/></label>; }
