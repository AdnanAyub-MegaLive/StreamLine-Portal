import { prisma } from "@/lib/prisma";
import {
  mobileApiError,
  mobileJson,
  mobileOptions,
  requireMobileUser,
} from "@/lib/mobile-api";
import { coinsForShare, getProfitSplitRule } from "@/lib/profit-rules";

export function OPTIONS() {
  return mobileOptions();
}

export async function POST(request) {
  try {
    const sessionUser = await requireMobileUser(request);
    const body = await request.json();
    const recipientId = String(body?.recipientId ?? "").trim();
    const giftName = String(body?.giftName ?? "").trim().slice(0, 100);
    const roomId = String(body?.roomId ?? "").trim().slice(0, 120) || null;
    const quantity = Number(body?.quantity ?? 1);
    let grossCoins;
    try {
      grossCoins = BigInt(String(body?.coinValue ?? ""));
    } catch {
      grossCoins = 0n;
    }
    if (
      !recipientId ||
      !giftName ||
      grossCoins <= 0n ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 999
    ) {
      const error = new Error(
        "recipientId, giftName, a positive coinValue, and a valid quantity are required.",
      );
      error.code = "VALIDATION_ERROR";
      throw error;
    }
    if (recipientId === sessionUser.publicId) {
      const error = new Error("You cannot send a gift to yourself.");
      error.code = "VALIDATION_ERROR";
      throw error;
    }

    const [recipientUser, talent, policy] = await Promise.all([
      prisma.user.findFirst({
        where: { publicId: recipientId, deletedAt: null },
        select: { id: true, publicId: true, name: true, role: true, agencyId: true },
      }),
      prisma.talent.findUnique({
        where: { publicId: recipientId },
        select: { id: true, publicId: true, displayName: true, agencyId: true },
      }),
      getProfitSplitRule(),
    ]);
    if (!recipientUser && !talent) throw new Error("USER_NOT_FOUND");
    const isHost = Boolean(talent || recipientUser?.role === "HOST");
    const agencyId = talent?.agencyId ?? recipientUser?.agencyId ?? null;
    if (isHost && !agencyId) {
      const error = new Error("Hosts must belong to an agency before receiving gifts.");
      error.code = "HOST_AGENCY_REQUIRED";
      throw error;
    }

    const result = await prisma.$transaction(async (tx) => {
      const debited = await tx.user.updateMany({
        where: { id: sessionUser.id, coinBalance: { gte: grossCoins } },
        data: {
          coinBalance: { decrement: grossCoins },
          totalSpent: { increment: grossCoins },
        },
      });
      if (!debited.count) throw new Error("INSUFFICIENT_COINS");

      const hostSalaryCoins = isHost
        ? coinsForShare(grossCoins, policy.hostShareBps)
        : 0n;
      const agencyCoins = isHost
        ? coinsForShare(grossCoins, policy.agencyShareBps)
        : 0n;
      const reusableCoins = isHost
        ? 0n
        : coinsForShare(grossCoins, policy.normalUserReusableShareBps);
      const companyCoins = isHost
        ? grossCoins - hostSalaryCoins - agencyCoins
        : grossCoins - reusableCoins;

      const gift = await tx.giftTransaction.create({
        data: {
          senderId: sessionUser.id,
          talentId: talent?.id ?? null,
          recipientUserId: recipientUser?.id ?? null,
          giftName,
          quantity,
          coinValue: grossCoins,
          roomId,
        },
      });
      if (talent)
        await tx.talent.update({
          where: { id: talent.id },
          data: {
            totalGiftsValue: { increment: grossCoins },
            hostSalaryCoinBalance: { increment: hostSalaryCoins },
          },
        });
      else if (recipientUser)
        await tx.user.update({
          where: { id: recipientUser.id },
          data: isHost
            ? { hostSalaryCoinBalance: { increment: hostSalaryCoins } }
            : { coinBalance: { increment: reusableCoins } },
        });
      if (agencyId)
        await tx.agency.update({
          where: { id: agencyId },
          data: { commissionCoinBalance: { increment: agencyCoins } },
        });
      const settlement = await tx.giftSettlement.create({
        data: {
          giftTransactionId: gift.id,
          agencyId,
          recipientType: isHost ? "HOST" : "NORMAL_USER",
          grossCoins,
          hostSalaryCoins,
          agencyCoins,
          companyCoins,
          reusableCoins,
          hostShareBps: isHost ? policy.hostShareBps : 0,
          agencyShareBps: isHost ? policy.agencyShareBps : 0,
          companyShareBps: isHost
            ? policy.companyShareBps
            : 10000 - policy.normalUserReusableShareBps,
          reusableShareBps: policy.normalUserReusableShareBps,
          policyVersion: policy.version,
        },
      });
      await tx.auditLog.create({
        data: {
          action: "GIFT_SETTLED",
          category: "FINANCE",
          entityType: "GiftTransaction",
          entityId: gift.id,
          description: `Gift from ${sessionUser.publicId} to ${recipientId} was settled using profit policy version ${policy.version}.`,
          metadata: {
            source: "MOBILE_APP",
            recipientId,
            recipientType: settlement.recipientType,
            grossCoins: grossCoins.toString(),
            hostSalaryCoins: hostSalaryCoins.toString(),
            agencyCoins: agencyCoins.toString(),
            companyCoins: companyCoins.toString(),
            reusableCoins: reusableCoins.toString(),
          },
        },
      });
      return { gift, settlement };
    });

    return mobileJson(
      {
        success: true,
        data: {
          transactionId: result.gift.id,
          recipientId,
          recipientType: result.settlement.recipientType,
          grossCoins: result.settlement.grossCoins.toString(),
          hostSalaryCoins: result.settlement.hostSalaryCoins.toString(),
          agencyCoins: result.settlement.agencyCoins.toString(),
          companyCoins: result.settlement.companyCoins.toString(),
          reusableCoins: result.settlement.reusableCoins.toString(),
          policyVersion: result.settlement.policyVersion,
          createdAt: result.gift.createdAt.toISOString(),
        },
      },
      201,
    );
  } catch (error) {
    if (error?.message === "INSUFFICIENT_COINS")
      return mobileJson(
        { success: false, error: { code: "INSUFFICIENT_COINS", message: "Your coin balance is too low for this gift." } },
        409,
      );
    if (error?.code === "HOST_AGENCY_REQUIRED")
      return mobileJson(
        { success: false, error: { code: error.code, message: error.message } },
        409,
      );
    console.error("Gift settlement failed", error);
    return mobileApiError(error, "GIFT_SEND_FAILED");
  }
}
