"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const tabs = ["Banners", "Frames", "Entrances", "Tail-lights", "Gifts", "Badges", "Chat Boxes", "Room Backgrounds"];
const categories = {Banners:"BANNERS",Frames:"FRAMES",Entrances:"ENTRANCES","Tail-lights":"TAIL_LIGHTS",Gifts:"GIFTS",Badges:"BADGES","Chat Boxes":"CHAT_BOXES","Room Backgrounds":"ROOM_BACKGROUNDS"};

export default function UploadTabs({ initialUploads,users }) {
  const [active,setActive] = useState(tabs[0]);
  const [uploads,setUploads] = useState(initialUploads);
  const [modalOpen,setModalOpen] = useState(false);
  const [name,setName] = useState("");
  const [file,setFile] = useState(null);
  const [previewUrl,setPreviewUrl] = useState(null);
  const [assignedUserId,setAssignedUserId] = useState("");
  const [isRoomBackground,setIsRoomBackground] = useState(false);
  const [saving,setSaving] = useState(false);
  const [updatingIds,setUpdatingIds] = useState(new Set());
  const [error,setError] = useState("");
  const previewRef=useRef(null);

  useEffect(()=>()=>{ if(previewRef.current)URL.revokeObjectURL(previewRef.current); },[]);

  function chooseFile(event) {
    const nextFile=event.target.files?.[0]??null;
    if(previewRef.current)URL.revokeObjectURL(previewRef.current);
    const nextUrl=nextFile?URL.createObjectURL(nextFile):null;
    previewRef.current=nextUrl;
    setFile(nextFile); setPreviewUrl(nextUrl); setError("");
  }

  function openModal() {
    setName(""); setFile(null); setPreviewUrl(null); setAssignedUserId("");
    setIsRoomBackground(active==="Room Backgrounds"); setError(""); setModalOpen(true);
  }

  function closeModal() {
    if(previewRef.current)URL.revokeObjectURL(previewRef.current);
    previewRef.current=null; setModalOpen(false); setName(""); setFile(null); setPreviewUrl(null); setError("");
  }

  async function addUpload(event) {
    event.preventDefault();
    if(!name.trim()||!file)return;
    setSaving(true); setError("");
    const form=new FormData();
    form.set("name",name.trim()); form.set("category",categories[active]); form.set("file",file);
    form.set("assignedUserId",assignedUserId); form.set("isRoomBackground",String(isRoomBackground));
    try {
      const response=await fetch("/api/uploads",{method:"POST",body:form});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error?.message||"Upload failed.");
      setUploads((current)=>[result.data.asset,...current]);
      closeModal();
    } catch(uploadError) { setError(uploadError.message); }
    finally { setSaving(false); }
  }

  async function updateAsset(asset,changes) {
    setUpdatingIds((current)=>new Set(current).add(asset.id)); setError("");
    try {
      const response=await fetch("/api/uploads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({assetId:asset.id,assignedUserId:Object.hasOwn(changes,"assignedUserId")?changes.assignedUserId:asset.assignedUser?.id??null,isRoomBackground:Object.hasOwn(changes,"isRoomBackground")?changes.isRoomBackground:asset.isRoomBackground})});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error?.message||"Update failed.");
      setUploads((current)=>current.map((item)=>item.id===asset.id?result.data.asset:item));
    } catch(updateError) { setError(updateError.message); }
    finally { setUpdatingIds((current)=>{const next=new Set(current);next.delete(asset.id);return next;}); }
  }

  const records=uploads.filter((item)=>item.category===categories[active]);
  return <><div className="mb-7 overflow-x-auto border-b border-[#dce7e4]" role="tablist" aria-label="Upload categories"><div className="flex min-w-max gap-1">{tabs.map((tab)=><button key={tab} type="button" onClick={()=>{setActive(tab);setError("");}} className={`relative px-4 py-3 text-xs font-semibold transition ${active===tab?"text-[#087f74] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#087f74]":"text-[#71847f] hover:text-[#294a45]"}`} role="tab" aria-selected={active===tab}>{tab}</button>)}</div></div>
    <section role="tabpanel"><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-lg font-bold">{active}</h3><p className="mt-1 text-xs text-[#788b86]">Database-backed files available to the mobile application.</p></div><button type="button" onClick={openModal} className="rounded-lg bg-[#087f74] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#066c63]">+ Add new {singular(active)}</button></div>
      {error&&!modalOpen&&<p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{error}</p>}
      {records.length?<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{records.map((item)=><PreviewCard key={item.id} item={item} users={users} saving={updatingIds.has(item.id)} onUpdate={updateAsset}/>)}</div>:<div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-[#cbded9] bg-white px-6 text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e4f6f3] text-2xl text-[#087f74]">↑</span><h4 className="mt-4 text-sm font-bold">No {active.toLowerCase()} uploaded</h4><p className="mt-1 text-xs text-[#82938f]">Use “Add new” to upload the first {singular(active).toLowerCase()}.</p></div></div>}
    </section>
    {modalOpen&&<div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#071f1d]/55 p-4" role="dialog" aria-modal="true" aria-labelledby="upload-title"><form onSubmit={addUpload} className="my-4 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-[#e5ecea] px-6 py-5"><div><p className="text-[10px] font-bold tracking-widest text-[#16877d] uppercase">{active}</p><h3 id="upload-title" className="mt-1 text-lg font-bold">Add new {singular(active)}</h3></div><button type="button" onClick={closeModal} className="rounded-lg p-2 text-[#71847f] hover:bg-[#f1f6f5]" aria-label="Close upload dialog">✕</button></div><div className="space-y-4 p-6"><label className="block"><span className="mb-2 block text-xs font-bold">Display name</span><input value={name} onChange={(event)=>setName(event.target.value)} required maxLength={80} className="h-11 w-full rounded-lg border border-[#d7e4e1] px-4 text-sm outline-none focus:border-[#2ca89c]"/></label><label className="block"><span className="mb-2 block text-xs font-bold">Assign to user <span className="font-normal text-[#849691]">(optional)</span></span><select value={assignedUserId} onChange={(event)=>setAssignedUserId(event.target.value)} className="h-11 w-full rounded-lg border border-[#d7e4e1] bg-white px-3 text-xs outline-none focus:border-[#2ca89c]"><option value="">Available to all users</option>{users.map((user)=><option key={user.id} value={user.id}>{user.name} · {user.id} · {user.phone}</option>)}</select></label><label className="flex items-start gap-3 rounded-xl border border-[#dce8e5] bg-[#f8fbfa] p-4"><input type="checkbox" checked={isRoomBackground} onChange={(event)=>setIsRoomBackground(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#087f74]"/><span><strong className="block text-xs">Make available as a room background</strong><span className="mt-1 block text-[10px] text-[#7e918c]">The mobile app can list and apply this asset as an audio-room background.</span></span></label><label className="block"><span className="mb-2 block text-xs font-bold">Upload file</span><span className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#cbded9] bg-[#f8fbfa] px-5 text-center"><strong className="text-xs text-[#087f74]">Choose image, GIF, or video</strong><span className="mt-1 text-[10px] text-[#849691]">Maximum 15 MB</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm" onChange={chooseFile} required className="sr-only"/></span></label>{file&&<div className="rounded-xl border border-[#dce8e5] p-3"><div className="aspect-video overflow-hidden rounded-lg bg-[#edf4f2]"><MediaPreview url={previewUrl} type={file.type} name={name||file.name}/></div><p className="mt-2 text-[10px] text-[#71847f]">{file.name} · {formatSize(file.size)}</p></div>}{error&&<p className="rounded-lg bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{error}</p>}</div><div className="flex justify-end gap-2 border-t border-[#e5ecea] bg-[#fafcfc] px-6 py-4"><button type="button" onClick={closeModal} disabled={saving} className="rounded-lg border border-[#d7e4e1] px-4 py-2.5 text-xs font-bold">Cancel</button><button type="submit" disabled={!name.trim()||!file||saving} className="rounded-lg bg-[#087f74] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-40">{saving?"Uploading…":`Upload to ${active}`}</button></div></form></div>}
  </>;
}

function PreviewCard({ item,users,saving,onUpdate }) { return <article className="overflow-hidden rounded-2xl border border-[#dce8e5] bg-white shadow-[0_7px_22px_rgba(15,65,60,.04)]"><div className="aspect-video bg-[#edf4f2]"><MediaPreview url={item.url} type={item.mimeType} name={item.name}/></div><div className="p-4"><h4 className="truncate text-sm font-bold">{item.name}</h4><p className="mt-1 truncate text-[10px] text-[#82938f]">{item.fileName}</p><div className="mt-3 flex flex-wrap gap-1.5"><span className="rounded-full bg-[#e8f6f3] px-2 py-1 text-[9px] font-bold text-[#087f74]">{item.mimeType.startsWith("video/")?"Video":"Image"}</span>{item.isRoomBackground&&<span className="rounded-full bg-violet-50 px-2 py-1 text-[9px] font-bold text-violet-700">Room background</span>}</div><div className="mt-4 border-t border-[#edf2f1] pt-3"><label className="text-[9px] font-bold tracking-wide text-[#71847f] uppercase">Assigned user</label><select value={item.assignedUser?.id??""} disabled={saving} onChange={(event)=>onUpdate(item,{assignedUserId:event.target.value||null})} className="mt-1.5 h-9 w-full rounded-lg border border-[#dce6e4] bg-white px-2 text-[10px]"><option value="">All users</option>{users.map((user)=><option key={user.id} value={user.id}>{user.name} · {user.id}</option>)}</select><label className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-[#536863]"><input type="checkbox" checked={item.isRoomBackground} disabled={saving} onChange={(event)=>onUpdate(item,{isRoomBackground:event.target.checked})} className="accent-[#087f74]"/>Use as room background</label>{saving&&<p className="mt-2 text-[9px] text-[#087f74]">Saving changes…</p>}</div></div></article>; }
function MediaPreview({ url,type,name }) { return type?.startsWith("video/")?<video src={url} controls muted className="h-full w-full object-cover" aria-label={`${name} preview`}/>:<span className="relative block h-full w-full"><Image src={url} alt={`${name} preview`} fill unoptimized className="object-cover"/></span>; }
function singular(value) { return ({Banners:"Banner",Frames:"Frame",Entrances:"Entrance","Tail-lights":"Tail-light",Gifts:"Gift",Badges:"Badge","Chat Boxes":"Chat Box","Room Backgrounds":"Room Background"})[value]; }
function formatSize(bytes) { return bytes<1024?`${bytes} B`:bytes<1048576?`${(bytes/1024).toFixed(1)} KB`:`${(bytes/1048576).toFixed(1)} MB`; }
