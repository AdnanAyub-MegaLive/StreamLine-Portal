import { prisma } from "./prisma";
import mobileSession from "./mobile-session.cjs";

export const mobileCorsHeaders = {
  "Access-Control-Allow-Origin": process.env.MOBILE_APP_ORIGIN || "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store, max-age=0",
};

export function mobileJson(body, status = 200) {
  return Response.json(body, { status, headers: mobileCorsHeaders });
}

export function mobileOptions() {
  return new Response(null, { status: 204, headers: mobileCorsHeaders });
}

export async function requireMobileUser(request) {
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  const payload = mobileSession.verifyMobileSessionToken(token);
  const user = await prisma.user.findUnique({
    where: { publicId: payload.userId },
    select: {
      id: true,
      publicId: true,
      name: true,
      profileImage: true,
      deletedAt: true,
      sessionVersion: true,
    },
  });
  if (
    !user ||
    user.deletedAt ||
    user.sessionVersion !== payload.sessionVersion
  )
    throw new Error("INVALID_SESSION");
  return user;
}

export function mobileApiError(error, fallbackCode = "REQUEST_FAILED") {
  const known = {
    INVALID_SESSION: [401, "INVALID_SESSION", "The mobile session is invalid or expired."],
    INVALID_SESSION_TOKEN: [401, "INVALID_SESSION", "The mobile session is invalid or expired."],
    EXPIRED_SESSION_TOKEN: [401, "INVALID_SESSION", "The mobile session is invalid or expired."],
    CONVERSATION_NOT_FOUND: [404, "CONVERSATION_NOT_FOUND", "Conversation not found."],
    NOTIFICATION_NOT_FOUND: [404, "NOTIFICATION_NOT_FOUND", "Notification not found."],
    USER_NOT_FOUND: [404, "USER_NOT_FOUND", "The selected user was not found."],
    SELF_CONVERSATION: [422, "SELF_CONVERSATION", "You cannot start a direct conversation with yourself."],
    VALIDATION_ERROR: [
      422,
      "VALIDATION_ERROR",
      error.validationMessage ?? error.message,
    ],
  };
  const [status, code, message] = known[error?.code ?? error?.message] ?? [
    500,
    fallbackCode,
    "Unable to complete this request right now.",
  ];
  return mobileJson({ success: false, error: { code, message } }, status);
}
