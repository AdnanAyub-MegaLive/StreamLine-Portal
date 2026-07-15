import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "../../../auth";
import ManagementTabs from "./management-tabs";
import AddAccountModal from "../components/add-account-modal";

const nav = [["Overview", "/home"], ["Users / Senders", "/users"], ["Talent Management", "/talents"], ["Live streams", "#"], ["Audio rooms", "#"], ["Reports", "#"]];

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  return <main className="min-h-screen bg-[#f4f8f7] text-[#142c2a]">
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#092f2d] px-5 py-7 text-white lg:flex"><Link href="/home" className="flex items-center gap-3 px-2 text-xl font-bold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-linear-to-br from-[#48e4ce] to-[#18b7a6] text-[#073d39]">▶</span>streamline</Link><nav className="mt-12 space-y-1">{nav.map(([label, href]) => <Link key={label} href={href} className={`block rounded-xl px-4 py-3 text-sm ${href === "/users" ? "bg-white/10 font-semibold text-[#62e0d0]" : "text-[#a9c5c1] hover:bg-white/5 hover:text-white"}`}>{label}</Link>)}</nav><div className="mt-auto border-t border-white/10 pt-5 text-xs text-[#82a6a1]">Streamline Admin<br/>Control center</div></aside>
    <section className="lg:pl-64"><header className="flex h-20 items-center justify-between border-b border-[#dfe9e7] bg-white px-6 md:px-10"><div><p className="text-xs font-semibold tracking-widest text-[#16877d] uppercase">Management</p><h1 className="text-xl font-bold">Users / Senders</h1></div><div className="flex items-center gap-4"><div className="hidden text-right sm:block"><p className="text-sm font-semibold">{session.user.name}</p><p className="text-xs text-[#718580]">{session.user.email}</p></div><form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><button className="rounded-lg border border-[#d7e4e1] px-4 py-2 text-xs font-semibold text-[#526b67] hover:bg-[#f1f7f5]">Sign out</button></form></div></header>
      <div className="mx-auto max-w-7xl p-6 md:p-10"><div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-bold">Sender management</h2><p className="mt-1.5 text-sm text-[#71847f]">Manage users who watch, listen, and send gifts to talents.</p></div><AddAccountModal type="user" /></div>
        <ManagementTabs />
      </div></section>
  </main>;
}
