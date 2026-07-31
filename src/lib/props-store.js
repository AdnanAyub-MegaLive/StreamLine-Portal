import { prisma } from "./prisma.js";
import { createSignedAssetUrl } from "./upload-assets.js";
import { requestOrigin } from "./user-perks.js";

export const equippablePropCategories = new Set([
  "FRAMES",
  "ENTRANCES",
  "RIDES",
  "TAIL_LIGHTS",
  "BADGES",
  "CHAT_BOXES",
  "ROOM_BACKGROUNDS",
]);

export function entitlementExpiry(asset, from = new Date()) {
  return asset.defaultGrantDurationMinutes
    ? new Date(from.getTime() + asset.defaultGrantDurationMinutes * 60000)
    : null;
}

export async function syncProgressionProps(userId, client = prisma) {
  const user = await client.user.findUnique({
    where: { id: userId },
    select: { id: true, vipLevel: true, totalTopUp: true, deletedAt: true },
  });
  if (!user || user.deletedAt) return;
  const eligible = await client.uploadAsset.findMany({
    where: {
      active: true,
      OR: [
        {
          distribution: "VIP",
          minimumVipLevel: { not: null, lte: user.vipLevel },
        },
        {
          distribution: "SVIP",
          minimumRecharge: { not: null, lte: user.totalTopUp },
        },
      ],
    },
    select: {
      id: true,
      distribution: true,
      defaultGrantDurationMinutes: true,
    },
  });
  if (!eligible.length) return;
  const now = new Date();
  await client.uploadAssetAssignment.createMany({
    data: eligible.map((asset) => ({
      assetId: asset.id,
      userId: user.id,
      durationMinutes: asset.defaultGrantDurationMinutes,
      expiresAt: entitlementExpiry(asset, now),
      source: asset.distribution,
      sourceReference:
        asset.distribution === "VIP"
          ? `VIP_LEVEL_${user.vipLevel}`
          : `TOTAL_RECHARGE_${user.totalTopUp}`,
    })),
    skipDuplicates: true,
  });
}

export function activeEntitlementWhere(userId, now = new Date()) {
  return {
    userId,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}

export function mobileAssetUrl(request, asset, user) {
  return createSignedAssetUrl(
    requestOrigin(request),
    asset.publicId,
    user.publicId,
    user.sessionVersion,
  );
}

export function storeAssetPayload(asset, user, entitlement, equipped) {
  const lockedReason = entitlement
    ? null
    : asset.distribution === "VIP"
      ? `Requires VIP ${asset.minimumVipLevel}`
      : asset.distribution === "SVIP"
        ? `Requires total recharge of ${asset.minimumRecharge ?? 0n}`
        : asset.distribution === "ACTIVITY"
          ? "Earn this item from an activity or event."
          : asset.distribution === "MANUAL"
            ? "Available through a Super Admin grant."
            : null;
  return {
    id: asset.publicId,
    name: asset.name,
    details: asset.details,
    tags: asset.tags,
    category: asset.category,
    mimeType: asset.mimeType,
    fileSize: asset.fileSize,
    url: asset.url,
    distribution: asset.distribution,
    price: asset.coinPrice?.toString() ?? null,
    minimumVipLevel: asset.minimumVipLevel,
    minimumRecharge: asset.minimumRecharge?.toString() ?? null,
    defaultGrantDurationMinutes: asset.defaultGrantDurationMinutes,
    owned: Boolean(entitlement),
    ownership: entitlement
      ? {
          source: entitlement.source,
          acquiredAt: entitlement.assignedAt.toISOString(),
          expiresAt: entitlement.expiresAt?.toISOString() ?? null,
          permanent: entitlement.expiresAt === null,
        }
      : null,
    equipped: equipped?.assetId === asset.id,
    lockedReason,
    canPurchase:
      asset.distribution === "STORE" &&
      asset.storeVisible &&
      !entitlement &&
      user.coinBalance >= (asset.coinPrice ?? 0n),
  };
}
