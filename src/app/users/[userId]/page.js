import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "../../../../auth";
import ProfileManager from "../../components/profile-manager";
import { prisma } from "../../../lib/prisma";
import MessageHistory from "./message-history";

export default async function UserProfilePage({ params }) {
  const session = await auth();
  if (!session?.user) redirect("/");
  const { userId } = await params;
  const user = await prisma.user.findFirst({
    where: { publicId: decodeURIComponent(userId), deletedAt: null },
    include: {
      devices: { orderBy: { lastLoginAt: "desc" }, take: 1 },
      uploadAssignments: {
        where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        select: {
          assignedAt: true,
          expiresAt: true,
          asset: {
            select: {
              publicId: true,
              name: true,
              category: true,
              fileName: true,
              mimeType: true,
              fileSize: true,
              isRoomBackground: true,
            },
          },
        },
        orderBy: { assignedAt: "desc" },
      },
      _count: { select: { sentGifts: true } },
    },
  });
  if (!user) notFound();
  const [messages, notifications] = await Promise.all([
    prisma.message.findMany({
      where: {
        conversation: { participants: { some: { userId: user.id } } },
      },
      select: {
        publicId: true,
        senderId: true,
        body: true,
        createdAt: true,
        sender: { select: { publicId: true, name: true } },
        conversation: {
          select: {
            publicId: true,
            kind: true,
            name: true,
            participants: {
              select: {
                user: { select: { publicId: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.notification.findMany({
      where: { OR: [{ userId: null }, { userId: user.id }] },
      select: {
        publicId: true,
        title: true,
        body: true,
        createdAt: true,
        userId: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);
  const device = user.devices[0];
  const profile = {
    id: user.publicId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    country: user.country ?? "—",
    gender: user.gender ? display(user.gender) : "Not set",
    dob: user.dob?.toISOString().slice(0, 10) ?? "Not set",
    role: display(user.role),
    status: display(user.status),
    vipLevel: user.vipLevel,
    joined: user.createdAt.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    totalSpent: Number(user.totalSpent),
    balance: Number(user.coinBalance),
    gifts: user._count.sentGifts,
    lastLogin: device?.lastLoginAt?.toLocaleString("en-US") ?? "Never",
    ip: device?.lastLoginIp ?? "—",
    mac: device?.macAddress ?? "—",
    location: device?.location ?? "Unknown",
    assignedAssets: user.uploadAssignments.map(
      ({ asset, assignedAt, expiresAt }) => ({
        id: asset.publicId,
        name: asset.name,
        category: display(asset.category),
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
        isRoomBackground: asset.isRoomBackground,
        assignedAt: assignedAt.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        expiresAt: expiresAt?.toLocaleString("en-US") ?? "Never",
        url: `/api/uploads/${asset.publicId}/file`,
      }),
    ),
  };
  const messageHistory = [
    ...messages.map((message) => {
      const otherUsers = message.conversation.participants
        .map(({ user: participant }) => participant)
        .filter((participant) => participant.publicId !== user.publicId);
      return {
        type:
          message.conversation.kind === "WORLD"
            ? "World Chat"
            : "Direct Message",
        conversation:
          message.conversation.kind === "WORLD"
            ? message.conversation.name ?? "World Chat"
            : otherUsers.map((participant) => participant.name).join(", ") ||
              message.conversation.publicId,
        sender: message.sender
          ? `${message.sender.name} (${message.sender.publicId})`
          : "System",
        title: null,
        body: message.body,
        direction: message.senderId === user.id ? "Sent" : "Received",
        messageId: message.publicId,
        createdAt: message.createdAt.toLocaleString("en-US"),
        timestamp: message.createdAt.getTime(),
      };
    }),
    ...notifications.map((notification) => ({
      type: "Notification",
      conversation: notification.userId ? "Personal" : "Global broadcast",
      sender: "System",
      title: notification.title,
      body: notification.body,
      direction: "Received",
      messageId: notification.publicId,
      createdAt: notification.createdAt.toLocaleString("en-US"),
      timestamp: notification.createdAt.getTime(),
    })),
  ]
    .sort((left, right) => right.timestamp - left.timestamp);
  return (
    <main className="min-h-screen bg-[#f4f8f7] text-[#142c2a]">
      <header className="border-b border-[#dfe9e7] bg-white px-6 py-5 md:px-10">
        <div className="mx-auto max-w-7xl">
          <Link href="/users" className="text-xs font-bold text-[#087f74]">
            ← Back to Users / Senders
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-7xl p-6 md:p-10">
        <div className="mb-7 flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#dff5f1] text-xl font-bold text-[#087f74]">
            {profile.name
              .split(" ")
              .map((part) => part[0])
              .join("")}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              <span
                className={`rounded-full px-2 py-1 text-[9px] font-bold ${profile.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
              >
                {profile.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#748782]">
              {profile.id} · {profile.phone}
              {profile.email ? ` · ${profile.email}` : ""}
            </p>
          </div>
        </div>
        <ProfileManager profile={profile} type="user" />
        <MessageHistory records={messageHistory} />
      </div>
    </main>
  );
}

function display(value) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
