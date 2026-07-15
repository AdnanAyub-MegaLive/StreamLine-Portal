"use client";

import { useState } from "react";

const inputClass = "h-11 w-full rounded-lg border border-[#dce6e4] bg-white px-3.5 text-xs text-[#29423d] outline-none placeholder:text-[#9ba9a6] focus:border-[#2ca89c] focus:ring-3 focus:ring-[#2ca89c]/10";
const labelClass = "mb-2 block text-xs font-bold text-[#29423d]";

export default function AddAccountModal({ type }) {
  const [open, setOpen] = useState(false);
  const isTalent = type === "talent";

  function submit(event) {
    event.preventDefault();
    setOpen(false);
  }

  return <>
    <button onClick={() => setOpen(true)} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#087f74] px-4 text-xs font-bold text-white shadow-[0_8px_20px_rgba(8,127,116,.2)] transition hover:bg-[#076f66]"><span className="text-lg leading-none">+</span>{isTalent ? "Add talent" : "Add user"}</button>
    {open && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#061c1a]/60 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="add-account-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="my-auto w-full max-w-[560px] rounded-2xl bg-white shadow-[0_24px_80px_rgba(0,0,0,.25)]">
        <div className="flex items-start justify-between border-b border-[#e5ecea] px-6 py-5"><div><span className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-[#e5f5f2] text-lg font-bold text-[#087f74]">+</span><h2 id="add-account-title" className="text-lg font-bold text-[#172f2b]">{isTalent ? "Add new talent" : "Add new user"}</h2><p className="mt-1 text-xs text-[#748782]">{isTalent ? "Create a streamer or audio-room host profile." : "Create a new sender account on the platform."}</p></div><button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-xl text-[#7c8f8a] hover:bg-[#f0f5f4]" type="button" aria-label="Close modal">×</button></div>
        <form onSubmit={submit} className="p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={isTalent ? "Legal name" : "Full name"} id={`${type}-name`}><input className={inputClass} id={`${type}-name`} name="name" required placeholder={isTalent ? "Enter legal name" : "Enter full name"} /></Field>
            {isTalent && <Field label="Display name" id="talent-display-name"><input className={inputClass} id="talent-display-name" name="displayName" required placeholder="Public talent name" /></Field>}
            <Field label="Email address" id={`${type}-email`}><input className={inputClass} id={`${type}-email`} name="email" type="email" required placeholder="name@example.com" /></Field>
            <Field label="Phone number" id={`${type}-phone`}><input className={inputClass} id={`${type}-phone`} name="phone" type="tel" required placeholder="+1 555 000 0000" /></Field>
            <Field label="Country" id={`${type}-country`}><select className={inputClass} id={`${type}-country`} name="country" required defaultValue=""><option value="" disabled>Select country</option><option>United States</option><option>United Kingdom</option><option>United Arab Emirates</option><option>Canada</option><option>Australia</option><option>Singapore</option><option>Other</option></select></Field>
            {isTalent ? <><Field label="Talent type" id="talent-type"><select className={inputClass} id="talent-type" name="talentType" required defaultValue=""><option value="" disabled>Select talent type</option><option>Video Streamer</option><option>Audio Room Host</option><option>Video & Audio Host</option></select></Field><Field label="Verification status" id="verification-status"><select className={inputClass} id="verification-status" name="verificationStatus" defaultValue="Pending"><option>Pending</option><option>Under Review</option><option>Verified</option></select></Field></> : <><Field label="Account status" id="user-status"><select className={inputClass} id="user-status" name="status" defaultValue="Active"><option>Active</option><option>Pending</option><option>Suspended</option></select></Field><Field label="User type" id="user-type"><select className={inputClass} id="user-type" name="userType" defaultValue="Standard"><option>Standard</option><option>VIP User</option></select></Field></>}
          </div>
          {isTalent && <div className="mt-5"><label className={labelClass} htmlFor="talent-profile">Profile image <span className="font-normal text-[#879894]">(optional)</span></label><label htmlFor="talent-profile" className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[#cbdad7] bg-[#f9fbfb] px-4 py-3.5 hover:border-[#8eb9b3]"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#e6f3f1] text-[#28877e]"><svg className="h-5 w-5 fill-none stroke-current stroke-[1.7]" viewBox="0 0 24 24"><path d="M12 16V4m-4 4 4-4 4 4M5 14v5h14v-5"/></svg></span><span><strong className="block text-xs text-[#3f5752]">Upload profile image</strong><span className="text-[10px] text-[#879894]">PNG, JPG or WEBP</span></span><input id="talent-profile" name="profile" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" /></label></div>}
          <div className="mt-6 flex justify-end gap-2 border-t border-[#e8efed] pt-5"><button type="button" onClick={() => setOpen(false)} className="h-10 rounded-lg border border-[#d7e3e0] px-4 text-xs font-bold text-[#5d716c] hover:bg-[#f5f8f7]">Cancel</button><button type="submit" className="h-10 rounded-lg bg-[#087f74] px-5 text-xs font-bold text-white shadow-[0_6px_16px_rgba(8,127,116,.2)] hover:bg-[#076f66]">{isTalent ? "Add talent" : "Add user"}</button></div>
        </form>
      </div>
    </div>}
  </>;
}

function Field({ label, id, children }) {
  return <div><label className={labelClass} htmlFor={id}>{label}</label>{children}</div>;
}
