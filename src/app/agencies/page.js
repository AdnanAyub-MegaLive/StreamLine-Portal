import { redirect } from "next/navigation";
import { auth, signOut } from "../../../auth";
import FeatureSearch from "../components/feature-search";
import AgencyTabs from "./agency-tabs";
import PortalSidebar from "../components/portal-sidebar";
import { prisma } from "../../lib/prisma";

export default async function AgenciesPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  const records=await prisma.agencyApplication.findMany({
    select:{
      publicId:true,
      agencyName:true,
      email:true,
      whatsapp:true,
      bdCode:true,
      country:true,
      status:true,
      createdAt:true,
      updatedAt:true,
      reviewedAt:true,
      cnicFrontMime:true,
      cnicBackMime:true,
      reviewNote:true,
      rejectionReason:true,
      reviewedBy:{select:{name:true,email:true}},
      user:{select:{publicId:true,name:true,phone:true,profileImage:true}},
    },
    orderBy:{createdAt:"desc"},
    take:500,
  });
  const applications=records.map((application)=>({
    id:application.publicId,
    agencyName:application.agencyName,
    email:application.email,
    whatsapp:application.whatsapp,
    bdCode:application.bdCode,
    country:application.country,
    status:application.status,
    submittedAt:application.createdAt.toISOString(),
    updatedAt:application.updatedAt.toISOString(),
    reviewedAt:application.reviewedAt?.toISOString()??null,
    reviewNote:application.reviewNote,
    rejectionReason:application.rejectionReason,
    reviewedBy:application.reviewedBy?{name:application.reviewedBy.name,email:application.reviewedBy.email}:null,
    applicant:{
      id:application.user.publicId,
      name:application.user.name,
      phone:application.user.phone,
      profileImage:application.user.profileImage,
    },
    cnicFrontUrl:application.cnicFrontMime?`/api/agencies/applications/${application.publicId}/cnic/front`:null,
    cnicBackUrl:application.cnicBackMime?`/api/agencies/applications/${application.publicId}/cnic/back`:null,
  }));

  return (
    <main className="min-h-screen bg-[#f4f8f7] text-[#142c2a]">
      <PortalSidebar />
      <section className="lg:pl-64">
        <header className="flex h-20 items-center gap-6 border-b border-[#dfe9e7] bg-white px-6 md:px-10">
          <div className="shrink-0">
            <p className="text-xs font-semibold tracking-widest text-[#16877d] uppercase">
              Management
            </p>
            <h1 className="text-xl font-bold">Agencies</h1>
          </div>
          <FeatureSearch />
          <div className="ml-auto flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{session.user.name}</p>
              <p className="text-xs text-[#718580]">{session.user.email}</p>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className="rounded-lg border border-[#d7e4e1] px-4 py-2 text-xs font-semibold text-[#526b67] hover:bg-[#f1f7f5]">
                Sign out
              </button>
            </form>
          </div>
        </header>
        <div className="mx-auto max-w-7xl p-6 md:p-10">
          <div className="mb-7">
            <h2 className="text-2xl font-bold">Agency management</h2>
            <p className="mt-1.5 text-sm text-[#71847f]">
              Monitor agency rankings, host targets, tasks, applications, and
              salary activity.
            </p>
          </div>
          <AgencyTabs applications={applications}/>
        </div>
      </section>
    </main>
  );
}
