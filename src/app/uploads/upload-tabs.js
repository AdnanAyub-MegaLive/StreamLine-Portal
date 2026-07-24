"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const tabs = ["Banners", "Frames", "Entrances", "Tail-lights", "Gifts", "Badges", "Chat Boxes", "Room Backgrounds"];
const emptyUploads = Object.fromEntries(tabs.map((tab)=>[tab,[]]));

export default function UploadTabs() {
  const [active,setActive] = useState(tabs[0]);
  const [uploads,setUploads] = useState(emptyUploads);
  const [modalOpen,setModalOpen] = useState(false);
  const [name,setName] = useState("");
  const [file,setFile] = useState(null);
  const [previewUrl,setPreviewUrl] = useState(null);
  const urls = useRef(new Set());

  useEffect(()=>()=>{ for(const url of urls.current) URL.revokeObjectURL(url); },[]);

  function chooseFile(event) {
    const nextFile=event.target.files?.[0]??null;
    if(previewUrl){ URL.revokeObjectURL(previewUrl); urls.current.delete(previewUrl); }
    const nextUrl=nextFile?URL.createObjectURL(nextFile):null;
    if(nextUrl)urls.current.add(nextUrl);
    setFile(nextFile); setPreviewUrl(nextUrl);
  }

  function closeModal() {
    if(previewUrl){ URL.revokeObjectURL(previewUrl); urls.current.delete(previewUrl); }
    setModalOpen(false); setName(""); setFile(null); setPreviewUrl(null);
  }

  function addUpload(event) {
    event.preventDefault();
    if(!name.trim()||!file||!previewUrl)return;
    const item={id:crypto.randomUUID(),name:name.trim(),url:previewUrl,type:file.type,fileName:file.name,size:file.size};
    setUploads((current)=>({...current,[active]:[item,...current[active]]}));
    setModalOpen(false); setName(""); setFile(null); setPreviewUrl(null);
  }

  const records=uploads[active];
  return <><div className="mb-7 overflow-x-auto border-b border-[#dce7e4]" role="tablist" aria-label="Upload categories"><div className="flex min-w-max gap-1">{tabs.map((tab)=><button key={tab} type="button" onClick={()=>setActive(tab)} className={`relative px-4 py-3 text-xs font-semibold transition ${active===tab?"text-[#087f74] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#087f74]":"text-[#71847f] hover:text-[#294a45]"}`} role="tab" aria-selected={active===tab}>{tab}</button>)}</div></div>
    <section role="tabpanel"><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-lg font-bold">{active}</h3><p className="mt-1 text-xs text-[#788b86]">Manage files uploaded specifically for {active.toLowerCase()}.</p></div><button type="button" onClick={()=>setModalOpen(true)} className="rounded-lg bg-[#087f74] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#066c63]">+ Add new {singular(active)}</button></div>
      {records.length?<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{records.map((item)=><PreviewCard key={item.id} item={item}/>)}</div>:<div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-[#cbded9] bg-white px-6 text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e4f6f3] text-2xl text-[#087f74]">↑</span><h4 className="mt-4 text-sm font-bold">No {active.toLowerCase()} uploaded</h4><p className="mt-1 text-xs text-[#82938f]">Use “Add new” to upload the first {singular(active).toLowerCase()}.</p></div></div>}
    </section>
    {modalOpen&&<div className="fixed inset-0 z-50 grid place-items-center bg-[#071f1d]/55 p-4" role="dialog" aria-modal="true" aria-labelledby="upload-title"><form onSubmit={addUpload} className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-[#e5ecea] px-6 py-5"><div><p className="text-[10px] font-bold tracking-widest text-[#16877d] uppercase">{active}</p><h3 id="upload-title" className="mt-1 text-lg font-bold">Add new {singular(active)}</h3></div><button type="button" onClick={closeModal} className="rounded-lg p-2 text-[#71847f] hover:bg-[#f1f6f5]" aria-label="Close upload dialog">✕</button></div><div className="space-y-5 p-6"><label className="block"><span className="mb-2 block text-xs font-bold">Display name</span><input value={name} onChange={(event)=>setName(event.target.value)} required maxLength={80} placeholder={`Enter ${singular(active).toLowerCase()} name`} className="h-11 w-full rounded-lg border border-[#d7e4e1] px-4 text-sm outline-none focus:border-[#2ca89c] focus:ring-3 focus:ring-[#2ca89c]/10"/></label><label className="block"><span className="mb-2 block text-xs font-bold">Upload file</span><span className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#cbded9] bg-[#f8fbfa] px-5 text-center hover:border-[#6dbdb4]"><strong className="text-xs text-[#087f74]">Choose image, GIF, or video</strong><span className="mt-1 text-[10px] text-[#849691]">PNG, JPG, WEBP, GIF, MP4, or WEBM</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm" onChange={chooseFile} required className="sr-only"/></span></label>{file&&<div className="rounded-xl border border-[#dce8e5] p-3"><div className="aspect-video overflow-hidden rounded-lg bg-[#edf4f2]"><MediaPreview url={previewUrl} type={file.type} name={name||file.name}/></div><div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-[#71847f]"><span className="truncate">{file.name}</span><span className="shrink-0">{formatSize(file.size)}</span></div></div>}<div className="rounded-lg bg-[#eef7f5] px-4 py-3 text-[10px] text-[#55706a]">This file will be added only to the <strong>{active}</strong> category.</div></div><div className="flex justify-end gap-2 border-t border-[#e5ecea] bg-[#fafcfc] px-6 py-4"><button type="button" onClick={closeModal} className="rounded-lg border border-[#d7e4e1] px-4 py-2.5 text-xs font-bold text-[#60736f]">Cancel</button><button type="submit" disabled={!name.trim()||!file} className="rounded-lg bg-[#087f74] px-5 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Upload to {active}</button></div></form></div>}
  </>;
}

function PreviewCard({ item }) { return <article className="overflow-hidden rounded-2xl border border-[#dce8e5] bg-white shadow-[0_7px_22px_rgba(15,65,60,.04)]"><div className="aspect-video bg-[#edf4f2]"><MediaPreview url={item.url} type={item.type} name={item.name}/></div><div className="p-4"><h4 className="truncate text-sm font-bold">{item.name}</h4><p className="mt-1 truncate text-[10px] text-[#82938f]">{item.fileName}</p><div className="mt-3 flex items-center justify-between"><span className="rounded-full bg-[#e8f6f3] px-2 py-1 text-[9px] font-bold text-[#087f74]">{item.type.startsWith("video/")?"Video":"Image"}</span><span className="text-[9px] text-[#8b9a97]">{formatSize(item.size)}</span></div></div></article>; }
function MediaPreview({ url,type,name }) { return type?.startsWith("video/")?<video src={url} controls muted className="h-full w-full object-cover" aria-label={`${name} preview`}/>:<span className="relative block h-full w-full"><Image src={url} alt={`${name} preview`} fill unoptimized className="object-cover"/></span>; }
function singular(value) { return ({Banners:"Banner",Frames:"Frame",Entrances:"Entrance","Tail-lights":"Tail-light",Gifts:"Gift",Badges:"Badge","Chat Boxes":"Chat Box","Room Backgrounds":"Room Background"})[value]; }
function formatSize(bytes) { return bytes<1024?`${bytes} B`:bytes<1048576?`${(bytes/1024).toFixed(1)} KB`:`${(bytes/1048576).toFixed(1)} MB`; }
