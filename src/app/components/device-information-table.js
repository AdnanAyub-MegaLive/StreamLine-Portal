"use client";

import { useState } from "react";

const deviceRecords = [
  { userId: "USR-1048", userName: "Olivia Martin", ip: "203.0.113.42", mac: "A4:C3:F0:82:1D:7B", location: "Los Angeles, United States" },
  { userId: "USR-1047", userName: "Jackson Lee", ip: "198.51.100.18", mac: "3C:52:82:9A:4F:11", location: "Toronto, Canada" },
  { userId: "USR-1046", userName: "Sophia Brown", ip: "192.0.2.116", mac: "D8:3A:DD:71:B2:09", location: "London, United Kingdom" },
  { userId: "USR-1045", userName: "Noah Williams", ip: "203.0.113.91", mac: "70:66:55:C4:28:FE", location: "Sydney, Australia" },
  { userId: "USR-1044", userName: "Emma Wilson", ip: "198.51.100.73", mac: "B0:BE:76:2C:90:A5", location: "Dubai, United Arab Emirates" },
  { userId: "USR-1043", userName: "Liam Davis", ip: "192.0.2.204", mac: "48:E7:DA:16:6B:C2", location: "Singapore, Singapore" },
];

export default function DeviceInformationTable({ title = "Device Information", records = deviceRecords }) {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [bannedDevices, setBannedDevices] = useState([]);
  const [userIdQuery, setUserIdQuery] = useState("");
  const filteredRecords = records.filter((record) => record.userId.toLowerCase().includes(userIdQuery.trim().toLowerCase()));

  function handleBan(event) {
    event.preventDefault();
    setBannedDevices((current) => [...current, selectedDevice.userId]);
    setSelectedDevice(null);
  }

  return (
    <>
    <div className="overflow-hidden rounded-2xl border border-[#dce8e5] bg-white shadow-[0_8px_30px_rgba(15,65,60,.04)]">
      <div className="flex flex-col gap-4 border-b border-[#e5ecea] px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div><h3 className="text-lg font-bold text-[#142c2a]">{title}</h3><p className="mt-1 text-xs text-[#7a8d88]">Latest device and login information received from the application.</p></div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center"><div className="relative"><svg className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 fill-none stroke-[#80938f] stroke-2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input value={userIdQuery} onChange={(event) => setUserIdQuery(event.target.value)} className="h-10 w-full rounded-lg border border-[#dce6e4] bg-[#fafcfc] pr-3 pl-9 text-xs outline-none placeholder:text-[#9aa9a6] focus:border-[#2ca89c] focus:ring-3 focus:ring-[#2ca89c]/10 sm:w-56" placeholder="Search by User ID..." aria-label="Search device records by user ID" /></div><span className="w-fit rounded-full bg-[#e7f5f2] px-2.5 py-1 text-[9px] font-bold tracking-wider text-[#087f74] uppercase">JSON data preview</span></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] border-collapse text-left">
          <thead><tr className="bg-[#f8fbfa] text-[10px] font-bold tracking-[.07em] text-[#748883] uppercase">
            <th className="px-5 py-3.5">User ID</th><th className="py-3.5">User Name</th><th className="py-3.5">Last Login IP</th><th className="py-3.5">Last Login MAC Address</th><th className="py-3.5">Last Login Location</th><th className="px-5 py-3.5 text-right">Ban Device</th>
          </tr></thead>
          <tbody className="divide-y divide-[#edf2f1]">{filteredRecords.map((record) => <tr key={record.userId} className="transition hover:bg-[#f9fcfb]">
            <td className="px-5 py-4 text-xs font-bold text-[#087f74]">{record.userId}</td>
            <td className="py-4 text-xs font-semibold text-[#263e3a]">{record.userName}</td>
            <td className="py-4"><code className="rounded-md bg-[#f0f5f4] px-2 py-1 text-[11px] text-[#526a65]">{record.ip}</code></td>
            <td className="py-4"><code className="rounded-md bg-[#f0f5f4] px-2 py-1 text-[11px] text-[#526a65]">{record.mac}</code></td>
            <td className="py-4"><span className="flex items-center gap-2 text-xs text-[#5c716c]"><svg className="h-4 w-4 shrink-0 fill-none stroke-[#2d948a] stroke-[1.8]" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>{record.location}</span></td>
            <td className="px-5 py-4 text-right"><button onClick={() => setSelectedDevice(record)} disabled={bannedDevices.includes(record.userId)} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-[10px] font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-[#dce6e4] disabled:bg-[#f3f6f5] disabled:text-[#8fa09c]">{bannedDevices.includes(record.userId) ? "Device banned" : "Ban device"}</button></td>
          </tr>)}</tbody>
        </table>
        {!filteredRecords.length && <div className="py-16 text-center text-sm text-[#788b87]">No device records match this User ID.</div>}
      </div>
      <div className="border-t border-[#e8efed] px-5 py-4 text-[10px] text-[#849691]">Showing {filteredRecords.length} of {records.length} dummy device records</div>
    </div>
    {selectedDevice && <BanDeviceModal device={selectedDevice} onClose={() => setSelectedDevice(null)} onBan={handleBan} />}
    </>
  );
}

function BanDeviceModal({ device, onClose, onBan }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#061c1a]/60 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="ban-device-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="w-full max-w-[480px] rounded-2xl bg-white shadow-[0_24px_80px_rgba(0,0,0,.25)]">
      <div className="flex items-start justify-between border-b border-[#e5ecea] px-6 py-5"><div><div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600"><svg className="h-5 w-5 fill-none stroke-current stroke-[1.8]" viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.6 2.9 8.3 7 10 4.1-1.7 7-5.4 7-10V6l-7-3Z"/><path d="m9 9 6 6m0-6-6 6"/></svg></div><h2 id="ban-device-title" className="text-lg font-bold text-[#172f2b]">Ban this device?</h2><p className="mt-1 text-xs text-[#748782]">{device.userName} · {device.mac}</p></div><button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-xl text-[#7c8f8a] hover:bg-[#f0f5f4]" aria-label="Close ban device modal">×</button></div>
      <form onSubmit={onBan} className="p-6">
        <label className="mb-2 block text-xs font-bold text-[#29423d]" htmlFor="ban-reason">Reason to ban</label><textarea id="ban-reason" name="reason" required rows="3" placeholder="Describe why this device should be banned..." className="w-full resize-none rounded-lg border border-[#dce6e4] px-3.5 py-3 text-xs outline-none placeholder:text-[#9ba9a6] focus:border-red-400 focus:ring-3 focus:ring-red-100" />
        <label className="mt-5 mb-2 block text-xs font-bold text-[#29423d]" htmlFor="ban-duration">Duration to ban</label><select id="ban-duration" name="duration" required defaultValue="" className="h-11 w-full rounded-lg border border-[#dce6e4] bg-white px-3.5 text-xs text-[#526863] outline-none focus:border-red-400 focus:ring-3 focus:ring-red-100"><option value="" disabled>Select ban duration</option><option value="24-hours">24 hours</option><option value="7-days">7 days</option><option value="30-days">30 days</option><option value="90-days">90 days</option><option value="permanent">Permanent</option></select>
        <label className="mt-5 mb-2 block text-xs font-bold text-[#29423d]" htmlFor="banned-by">Ban by</label><input id="banned-by" name="bannedBy" required type="text" placeholder="Enter your admin name" className="h-11 w-full rounded-lg border border-[#dce6e4] px-3.5 text-xs outline-none placeholder:text-[#9ba9a6] focus:border-red-400 focus:ring-3 focus:ring-red-100" />
        <label className="mt-5 mb-2 block text-xs font-bold text-[#29423d]" htmlFor="ban-proof">Proof of ban <span className="font-normal text-[#879894]">(optional)</span></label>
        <label htmlFor="ban-proof" className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[#cbdad7] bg-[#f9fbfb] px-4 py-3.5 transition hover:border-[#8eb9b3] hover:bg-[#f4f9f8]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#e6f3f1] text-[#28877e]"><svg className="h-5 w-5 fill-none stroke-current stroke-[1.7]" viewBox="0 0 24 24"><path d="M12 16V4m-4 4 4-4 4 4M5 14v5h14v-5"/></svg></span><span><strong className="block text-xs text-[#3f5752]">Attach proof image</strong><span className="mt-0.5 block text-[10px] text-[#879894]">PNG, JPG or WEBP image</span></span><input id="ban-proof" name="proof" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" /></label>
        <div className="mt-6 flex justify-end gap-2 border-t border-[#e8efed] pt-5"><button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#d7e3e0] px-4 text-xs font-bold text-[#5d716c] hover:bg-[#f5f8f7]">Cancel</button><button type="submit" className="h-10 rounded-lg bg-red-600 px-5 text-xs font-bold text-white shadow-[0_6px_16px_rgba(220,38,38,.2)] hover:bg-red-700">Ban device</button></div>
      </form>
    </div>
  </div>;
}

export { deviceRecords };
