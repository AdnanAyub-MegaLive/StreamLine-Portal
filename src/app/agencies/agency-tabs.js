"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

const tabs = [
  "Agency Home",
  "Agency Tasks",
  "Monthly Salary",
  "Host Salaries",
  "Agency Apply",
];
const agencies = [
  {
    rank: 1,
    id: "AG-1008",
    name: "Starlight Network",
    talents: 84,
    gifts: "8.42M",
    target: "112%",
    status: "Achieved",
  },
  {
    rank: 2,
    id: "AG-1014",
    name: "Royal Creators",
    talents: 67,
    gifts: "7.18M",
    target: "96%",
    status: "On track",
  },
  {
    rank: 3,
    id: "AG-1003",
    name: "Moon Media",
    talents: 58,
    gifts: "6.45M",
    target: "88%",
    status: "On track",
  },
  {
    rank: 4,
    id: "AG-1021",
    name: "Voice Hub",
    talents: 49,
    gifts: "4.92M",
    target: "71%",
    status: "At risk",
  },
];
const topTalents = [
  {
    rank: 1,
    id: "TL-2048",
    name: "Aisha Khan",
    agency: "Starlight Network",
    gifts: "1.42M",
    target: "118%",
  },
  {
    rank: 2,
    id: "TL-2091",
    name: "Maya Stone",
    agency: "Royal Creators",
    gifts: "1.19M",
    target: "104%",
  },
  {
    rank: 3,
    id: "TL-2088",
    name: "Aiden Brooks",
    agency: "Moon Media",
    gifts: "984K",
    target: "92%",
  },
  {
    rank: 4,
    id: "TL-2112",
    name: "Zara Ali",
    agency: "Voice Hub",
    gifts: "876K",
    target: "87%",
  },
];

export default function AgencyTabs({applications=[]}) {
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab");
  const [active, setActive] = useState(
    tabs.includes(requested) ? requested : tabs[0],
  );
  return (
    <>
      <div
        className="mb-7 overflow-x-auto border-b border-[#dce7e4]"
        role="tablist"
        aria-label="Agency management sections"
      >
        <div className="flex min-w-max gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActive(tab)}
              className={`relative px-4 py-3 text-xs font-semibold transition ${active === tab ? "text-[#087f74] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#087f74]" : "text-[#71847f] hover:text-[#294a45]"}`}
              role="tab"
              aria-selected={active === tab}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <section role="tabpanel">
        {active === "Agency Home" ? <AgencyHome applications={applications}/> : <Module tab={active} applications={applications}/>}
      </section>
    </>
  );
}

function AgencyHome({applications}) {
  const pendingCount=applications.filter((application)=>application.status==="PENDING").length;
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Total agencies", "42", "38 currently active"],
          ["Agency hosts", "1,284", "Across all agencies"],
          ["Total agency recharge", "PKR 48.6M", "Recharge by all agencies"],
          ["Monthly gifts", "27.8M", "104% of target"],
          ["Pending applications", pendingCount.toLocaleString(), "Awaiting review"],
        ].map(([label, value, note]) => (
          <div
            key={label}
            className="rounded-xl border border-[#dfe9e7] bg-white p-5"
          >
            <p className="text-[11px] font-semibold text-[#768984]">{label}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
            <p className="mt-2 text-[10px] text-[#429387]">{note}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <AgencyTable />
        <TalentTable />
      </div>
    </div>
  );
}

function AgencyTable() {
  return (
    <Card
      title="Agency ranking"
      description="Ranked by current-month gift performance"
    >
      <table className="w-full min-w-[620px] text-left text-xs">
        <thead>
          <tr className="bg-[#f8fbfa] text-[10px] tracking-wider text-[#7b8e89] uppercase">
            <th className="px-5 py-3.5">Rank</th>
            <th>Agency</th>
            <th>Hosts</th>
            <th>Gifts</th>
            <th>Target</th>
            <th className="pr-5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf2f1]">
          {agencies.map((item) => (
            <tr key={item.id} className="hover:bg-[#f9fcfb]">
              <td className="px-5 py-4 font-bold text-[#087f74]">
                #{item.rank}
              </td>
              <td>
                <strong className="block">{item.name}</strong>
                <span className="text-[9px] text-[#849691]">{item.id}</span>
              </td>
              <td>{item.talents}</td>
              <td className="font-semibold">{item.gifts}</td>
              <td>{item.target}</td>
              <td className="pr-5">
                <Status value={item.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function TalentTable() {
  return (
    <Card
      title="Top hosts"
      description="Performance and agency target contribution"
    >
      <table className="w-full min-w-[580px] text-left text-xs">
        <thead>
          <tr className="bg-[#f8fbfa] text-[10px] tracking-wider text-[#7b8e89] uppercase">
            <th className="px-5 py-3.5">Rank</th>
            <th>Host</th>
            <th>Agency</th>
            <th>Gifts</th>
            <th className="pr-5">Target</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf2f1]">
          {topTalents.map((item) => (
            <tr key={item.id} className="hover:bg-[#f9fcfb]">
              <td className="px-5 py-4 font-bold text-[#087f74]">
                #{item.rank}
              </td>
              <td>
                <strong className="block">{item.name}</strong>
                <span className="text-[9px] text-[#849691]">{item.id}</span>
              </td>
              <td>{item.agency}</td>
              <td className="font-semibold">{item.gifts}</td>
              <td className="pr-5">{item.target}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function Module({ tab,applications }) {
  const copy = {
    "Agency Tasks": [
      "Agency tasks",
      "Create and review agency targets, deadlines, and completion status.",
    ],
    "Monthly Salary": [
      "Monthly agency salary",
      "Review monthly agency commissions and payment status.",
    ],
    "Host Salaries": [
      "Host salaries",
      "Review salary calculations for hosts working under each agency.",
    ],
    "Agency Apply": [
      "Agency applications",
      "Review applications to create or register a new agency.",
    ],
  }[tab];
  if(tab==="Agency Apply")return <AgencyApplications applications={applications}/>;
  return (
    <div className="rounded-2xl border border-[#dce8e5] bg-white p-8">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#e4f6f3] text-lg font-bold text-[#087f74]">
        {tab[0]}
      </span>
      <h3 className="mt-5 text-lg font-bold">{copy[0]}</h3>
      <p className="mt-2 max-w-2xl text-sm text-[#71847f]">{copy[1]}</p>
      <div className="mt-8 rounded-xl border border-dashed border-[#cbded9] bg-[#f8fbfa] px-6 py-12 text-center text-xs text-[#81938e]">
        This module is ready for its database workflow and management actions.
      </div>
    </div>
  );
}

function AgencyApplications({applications}) {
  const [records,setRecords]=useState(applications);
  const [query,setQuery]=useState("");
  const [status,setStatus]=useState("ALL");
  const [selected,setSelected]=useState(null);
  const normalized=query.trim().toLowerCase();
  const filtered=records.filter((application)=>{
    const matchesStatus=status==="ALL"||application.status===status;
    const haystack=`${application.id} ${application.agencyName} ${application.email??""} ${application.whatsapp} ${application.bdCode} ${application.country??""} ${application.applicant.id} ${application.applicant.name} ${application.applicant.phone}`.toLowerCase();
    return matchesStatus&&(!normalized||haystack.includes(normalized));
  });
  const pending=records.filter((application)=>application.status==="PENDING").length;
  function reviewed(result){
    const updates={status:result.status,reviewedAt:result.reviewedAt,reviewNote:result.reviewNote,rejectionReason:result.rejectionReason,reviewedBy:result.reviewedBy,updatedAt:result.reviewedAt};
    setRecords((current)=>current.map((application)=>application.id===result.applicationId?{...application,...updates}:application));
    setSelected(null);
  }
  return <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-3">
      {[["Total applications",records.length],["Pending review",pending],["Processed",records.length-pending]].map(([label,value])=><div key={label} className="rounded-xl border border-[#dce8e5] bg-white p-5"><p className="text-[10px] font-bold tracking-wide text-[#7c8f8a] uppercase">{label}</p><p className="mt-2 text-2xl font-bold text-[#173b37]">{value.toLocaleString()}</p></div>)}
    </div>
    <section className="overflow-hidden rounded-2xl border border-[#dce8e5] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#e5ecea] p-5 lg:flex-row lg:items-end lg:justify-between">
        <div><h3 className="text-base font-bold">Agency applications</h3><p className="mt-1 text-[10px] text-[#7d908b]">Applications submitted through the authenticated mobile application.</p></div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input type="search" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search agency, applicant, ID, phone…" className="h-10 min-w-72 rounded-lg border border-[#d7e4e1] px-3 text-xs outline-none focus:border-[#2ca89c]"/>
          <select value={status} onChange={(event)=>setStatus(event.target.value)} className="h-10 rounded-lg border border-[#d7e4e1] bg-white px-3 text-xs outline-none focus:border-[#2ca89c]"><option value="ALL">All statuses</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option></select>
        </div>
      </div>
      {filtered.length?<div className="overflow-x-auto"><table className="w-full min-w-[1300px] text-left text-xs"><thead><tr className="bg-[#f8fbfa] text-[9px] tracking-wider text-[#748782] uppercase"><th className="px-5 py-3.5">Application</th><th>Applicant</th><th>Contact</th><th>Country</th><th>BD code</th><th>CNIC front</th><th>CNIC back</th><th>Status</th><th>Submitted</th><th className="pr-5 text-right">Action</th></tr></thead><tbody className="divide-y divide-[#edf2f1]">{filtered.map((application)=><tr key={application.id} className="hover:bg-[#f9fcfb]"><td className="px-5 py-4"><button type="button" onClick={()=>setSelected(application)} className="text-left font-bold text-[#173b37] hover:text-[#087f74] hover:underline">{application.agencyName}</button><p className="mt-1 font-mono text-[9px] text-[#7f928d]">{application.id}</p></td><td><Link href={`/users/${encodeURIComponent(application.applicant.id)}`} target="_blank" className="font-bold text-[#087f74] hover:underline">{application.applicant.name}</Link><p className="mt-1 font-mono text-[9px] text-[#7f928d]">{application.applicant.id}</p></td><td><p>{application.whatsapp}</p><p className="mt-1 text-[9px] text-[#7f928d]">{application.email||"No email"}</p><p className="mt-1 text-[9px] text-[#7f928d]">{application.applicant.phone}</p></td><td>{application.country||"—"}</td><td className="font-mono font-bold">{application.bdCode}</td><td><CnicPreview url={application.cnicFrontUrl} label={`${application.agencyName} CNIC front`}/></td><td><CnicPreview url={application.cnicBackUrl} label={`${application.agencyName} CNIC back`}/></td><td><ApplicationStatus value={application.status}/></td><td><p>{formatDate(application.submittedAt)}</p><p className="mt-1 text-[9px] text-[#7f928d]">{relativeTime(application.submittedAt)}</p></td><td className="pr-5 text-right"><button type="button" onClick={()=>setSelected(application)} className="rounded-lg bg-[#e6f5f2] px-3 py-2 text-[9px] font-bold text-[#087f74] hover:bg-[#d4ece8]">{application.status==="PENDING"?"Review":"View"}</button></td></tr>)}</tbody></table></div>:<div className="px-6 py-16 text-center"><p className="text-sm font-bold text-[#526b67]">{records.length?"No applications match the current filters.":"No agency applications submitted yet."}</p><p className="mt-1 text-[10px] text-[#879792]">New mobile submissions will appear here automatically.</p></div>}
    </section>
    {selected&&<ApplicationReviewModal application={selected} onClose={()=>setSelected(null)} onReviewed={reviewed}/>}
  </div>;
}

function ApplicationReviewModal({application,onClose,onReviewed}) {
  const [decision,setDecision]=useState(null);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  async function submit(event){
    event.preventDefault();
    const note=String(new FormData(event.currentTarget).get("note")??"");
    setSaving(true);setError("");
    try{
      const response=await fetch(`/api/agencies/applications/${application.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({decision,note})});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error?.message||"Review failed.");
      onReviewed(result.data);
    }catch(reviewError){setError(reviewError.message);}
    finally{setSaving(false);}
  }
  const decided=application.status!=="PENDING";
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-[#071f1d]/65 p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="application-review-title">
    <div className="mx-auto my-3 w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-[#e3ebe9] px-6 py-5"><div><p className="text-[10px] font-bold tracking-widest text-[#16877d] uppercase">Agency application</p><h2 id="application-review-title" className="mt-1 text-xl font-bold">{application.agencyName}</h2><p className="mt-1 font-mono text-[10px] text-[#7d908b]">{application.id}</p></div><button type="button" onClick={onClose} disabled={saving} className="rounded-lg p-2 text-xl text-[#70827e] hover:bg-[#f0f5f4]" aria-label="Close application">×</button></div>
      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <h3 className="text-sm font-bold">Application details</h3>
          <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 rounded-xl border border-[#dce8e5] bg-[#f9fcfb] p-5">
            <Detail label="Applicant" value={application.applicant.name}/>
            <Detail label="User ID" value={application.applicant.id} mono/>
            <Detail label="Account phone" value={application.applicant.phone}/>
            <Detail label="WhatsApp" value={application.whatsapp}/>
            <Detail label="Email" value={application.email||"No email"}/>
            <Detail label="Country" value={application.country||"—"}/>
            <Detail label="BD code" value={application.bdCode} mono/>
            <Detail label="Submitted" value={formatDate(application.submittedAt)}/>
          </dl>
          <div className="mt-5 rounded-xl border border-[#dce8e5] p-5"><div className="flex items-center justify-between"><h3 className="text-sm font-bold">Review status</h3><ApplicationStatus value={application.status}/></div>{application.reviewedAt&&<div className="mt-4 space-y-2 text-xs"><p><span className="text-[#7b8e89]">Reviewed:</span> {formatDate(application.reviewedAt)}</p><p><span className="text-[#7b8e89]">By:</span> {application.reviewedBy?.name||"Administrator"}</p>{(application.rejectionReason||application.reviewNote)&&<p className="rounded-lg bg-[#f7faf9] p-3 leading-5"><span className="font-bold">{application.status==="REJECTED"?"Reason":"Note"}:</span> {application.rejectionReason||application.reviewNote}</p>}</div>}</div>
          <Link href={`/users/${encodeURIComponent(application.applicant.id)}`} target="_blank" className="mt-4 inline-flex rounded-lg border border-[#bddbd6] px-4 py-2.5 text-xs font-bold text-[#087f74] hover:bg-[#eef8f6]">Open user profile ↗</Link>
        </div>
        <div><h3 className="text-sm font-bold">Identity documents</h3><div className="mt-4 grid gap-4 sm:grid-cols-2"><DocumentPreview url={application.cnicFrontUrl} label="CNIC front"/><DocumentPreview url={application.cnicBackUrl} label="CNIC back"/></div><p className="mt-3 text-[9px] leading-4 text-[#80918d]">Click either image to inspect the original document in a new tab. CNIC media is protected by administrator authentication.</p></div>
      </div>
      {!decided&&<form onSubmit={submit} className="border-t border-[#e3ebe9] bg-[#fafcfc] px-6 py-5">{decision&&<div className="mb-4"><label className="mb-2 block text-xs font-bold">{decision==="REJECTED"?"Rejection reason":"Approval note (optional)"}</label><textarea name="note" required={decision==="REJECTED"} maxLength={1000} rows={3} className="w-full resize-none rounded-lg border border-[#d5e2df] bg-white p-3 text-xs outline-none focus:border-[#2ca89c]" placeholder={decision==="REJECTED"?"Explain why this application is being rejected…":"Add an optional internal note…"}/>{error&&<p className="mt-3 rounded-lg bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{error}</p>}</div>}<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={decision?()=>{setDecision(null);setError("");}:onClose} disabled={saving} className="rounded-lg border border-[#d4e0de] px-4 py-2.5 text-xs font-bold">{decision?"Back":"Close"}</button>{decision?<button type="submit" disabled={saving} className={`rounded-lg px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50 ${decision==="APPROVED"?"bg-emerald-600 hover:bg-emerald-700":"bg-rose-600 hover:bg-rose-700"}`}>{saving?"Saving…":`Confirm ${display(decision)}`}</button>:<><button type="button" onClick={()=>setDecision("REJECTED")} className="rounded-lg bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700">Reject application</button><button type="button" onClick={()=>setDecision("APPROVED")} className="rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700">Approve application</button></>}</div></form>}
      {decided&&<div className="flex justify-end border-t border-[#e3ebe9] bg-[#fafcfc] px-6 py-5"><button type="button" onClick={onClose} className="rounded-lg border border-[#d4e0de] px-5 py-2.5 text-xs font-bold">Close</button></div>}
    </div>
  </div>;
}

function Detail({label,value,mono}) {return <div><dt className="text-[9px] font-bold tracking-wide text-[#82938f] uppercase">{label}</dt><dd className={`mt-1 break-words text-xs font-semibold ${mono?"font-mono":""}`}>{value}</dd></div>;}
function DocumentPreview({url,label}) {return <a href={url} target="_blank" rel="noreferrer" className="group block"><div className="relative aspect-[1.58/1] overflow-hidden rounded-xl border border-[#d6e4e1] bg-[#edf4f2]"><Image src={url} alt={label} fill unoptimized className="object-contain transition group-hover:scale-[1.02]"/></div><p className="mt-2 text-center text-[10px] font-bold text-[#087f74]">{label} · Open original ↗</p></a>;}

function CnicPreview({url,label}) {
  return <a href={url} target="_blank" rel="noreferrer" className="group relative block h-14 w-20 overflow-hidden rounded-lg border border-[#d6e4e1] bg-[#edf4f2]"><Image src={url} alt={label} fill unoptimized className="object-cover transition group-hover:scale-105"/><span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[7px] font-bold text-white">Open</span></a>;
}

function ApplicationStatus({value}) {
  const styles={PENDING:"bg-amber-50 text-amber-700",APPROVED:"bg-emerald-50 text-emerald-700",REJECTED:"bg-rose-50 text-rose-700"};
  return <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${styles[value]??"bg-slate-100 text-slate-600"}`}>{display(value)}</span>;
}

function formatDate(value){return new Date(value).toLocaleString("en-US",{month:"short",day:"2-digit",year:"numeric",hour:"numeric",minute:"2-digit"});}
function relativeTime(value){const minutes=Math.max(0,Math.floor((Date.now()-new Date(value).getTime())/60000));if(minutes<1)return"Just now";if(minutes<60)return`${minutes}m ago`;const hours=Math.floor(minutes/60);if(hours<24)return`${hours}h ago`;return`${Math.floor(hours/24)}d ago`;}
function display(value){return String(value).toLowerCase().replaceAll("_"," ").replace(/\b\w/g,(letter)=>letter.toUpperCase());}

function Card({ title, description, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#dce8e5] bg-white">
      <div className="border-b border-[#e6eeec] px-5 py-4">
        <h3 className="text-sm font-bold">{title}</h3>
        <p className="mt-0.5 text-[10px] text-[#849590]">{description}</p>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
function Status({ value }) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-[9px] font-bold ${value === "At risk" ? "bg-rose-50 text-rose-700" : value === "Achieved" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
    >
      {value}
    </span>
  );
}
