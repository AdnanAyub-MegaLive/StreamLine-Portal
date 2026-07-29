import { prisma } from "../../../../../lib/prisma";
import {
  mobileApiError,
  mobileJson,
  mobileOptions,
  requireMobileUser,
} from "../../../../../lib/mobile-api";
import { requireConversationParticipant } from "../../../../../lib/messaging";

export function OPTIONS() {
  return mobileOptions();
}

export async function POST(request, { params }) {
  try {
    const user = await requireMobileUser(request);
    const { conversationId } = await params;
    const membership = await requireConversationParticipant(
      decodeURIComponent(conversationId),
      user.id,
    );
    const lastReadAt = new Date();
    await prisma.conversationParticipant.update({
      where: { id: membership.id },
      data: { lastReadAt },
    });
    const data = {
      conversationId: membership.conversation.publicId,
      userId: user.publicId,
      lastReadAt: lastReadAt.toISOString(),
    };
    globalThis.portalIo
      ?.to(`conversation:${membership.conversation.publicId}`)
      .emit("conversation:read", data);
    return mobileJson({ success: true, data });
  } catch (error) {
    console.error("Conversation read update failed", error);
    return mobileApiError(error, "READ_UPDATE_FAILED");
  }
}
