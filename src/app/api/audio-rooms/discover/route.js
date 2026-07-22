import { prisma } from "../../../../lib/prisma";
import mobileSession from "../../../../lib/mobile-session.cjs";
import { reconcileExpiredAudioRoomRestrictions } from "../../../../lib/audio-room-maintenance";

const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.MOBILE_APP_ORIGIN || "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(body, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

async function authenticatedUser(request) {
  const token = mobileSession.bearerToken(request);
  const payload = mobileSession.verifyMobileSession(token);

  if (!payload?.sub) throw new Error("INVALID_SESSION");

  const user = await prisma.user.findUnique({
    where: { publicId: payload.sub },
    select: {
      id: true,
      deletedAt: true,
      sessionVersion: true,
    },
  });

  if (
    !user ||
    user.deletedAt ||
    Number(payload.sessionVersion) !== user.sessionVersion
  ) {
    throw new Error("INVALID_SESSION");
  }

  return user;
}

export async function GET(request) {
  try {
    const user = await authenticatedUser(request);

    // Clear restrictions whose allotted time has passed before discovering rooms.
    await reconcileExpiredAudioRoomRestrictions();

    const rooms = await prisma.audioRoom.findMany({
      where: {
        ownerId: { not: user.id },
        status: "LIVE",
        isBlocked: false,
        joiningDisabled: false,
        owner: {
          deletedAt: null,
          status: "ACTIVE",
        },
      },
      select: {
        roomId: true,
        title: true,
        participantCount: true,
        startedAt: true,
        owner: {
          select: {
            publicId: true,
            name: true,
            profileImage: true,
          },
        },
      },
      orderBy: [
        { participantCount: "desc" },
        { startedAt: "desc" },
      ],
      take: 50,
    });

    return json({
      success: true,
      data: {
        rooms: rooms.map((room) => ({
          roomId: room.roomId,
          title: room.title,
          participantCount: room.participantCount,
          startedAt: room.startedAt,
          owner: {
            id: room.owner.publicId,
            name: room.owner.name,
            profileImage: room.owner.profileImage,
          },
        })),
      },
    });
  } catch {
    return json(
      {
        success: false,
        error: {
          code: "INVALID_SESSION",
          message: "The mobile session is invalid or expired.",
        },
      },
      401,
    );
  }
}
