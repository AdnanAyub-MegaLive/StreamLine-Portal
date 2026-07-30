export const uploadCategories = {
  Banners: "BANNERS",
  Frames: "FRAMES",
  Entrances: "ENTRANCES",
  "Tail-lights": "TAIL_LIGHTS",
  Gifts: "GIFTS",
  Badges: "BADGES",
  "Chat Boxes": "CHAT_BOXES",
  "Room Backgrounds": "ROOM_BACKGROUNDS",
};

export const validUploadCategories = new Set(Object.values(uploadCategories));

export function serializeUploadAsset(asset,url) {
  const assignedUsers=(asset.assignments??[]).map((assignment)=>({
    id:assignment.user.publicId,
    name:assignment.user.name,
    profileImage:assignment.user.profileImage,
    assignedAt:assignment.assignedAt?.toISOString()??null,
    durationMinutes:assignment.durationMinutes,
    expiresAt:assignment.expiresAt?.toISOString()??null,
    isExpired:Boolean(assignment.expiresAt&&assignment.expiresAt<=new Date()),
    source:assignment.source??"ADMIN",
    sourceReference:assignment.sourceReference??null,
    purchasePrice:assignment.purchasePrice?.toString()??null,
  }));
  return {
    id:asset.publicId,
    name:asset.name,
    details:asset.details,
    tags:asset.tags,
    category:asset.category,
    fileName:asset.fileName,
    mimeType:asset.mimeType,
    fileSize:asset.fileSize,
    url,
    actionUrl:asset.actionUrl,
    isGlobal:asset.isGlobal,
    isRoomBackground:asset.isRoomBackground,
    distribution:asset.distribution??"MANUAL",
    storeVisible:Boolean(asset.storeVisible),
    coinPrice:asset.coinPrice?.toString()??null,
    minimumVipLevel:asset.minimumVipLevel??null,
    minimumRecharge:asset.minimumRecharge?.toString()??null,
    defaultGrantDurationMinutes:asset.defaultGrantDurationMinutes??null,
    active:asset.active??true,
    assignedUsers,
    assignedUser:assignedUsers[0]??null,
    createdAt:asset.createdAt.toISOString(),
  };
}

function assetSignature(assetId,userId,sessionVersion,expiresAt) {
  if(!process.env.AUTH_SECRET)throw new Error("AUTH_SECRET is required for signed asset URLs.");
  return createHmac("sha256",process.env.AUTH_SECRET).update(`${assetId}:${userId}:${sessionVersion}:${expiresAt}`).digest("base64url");
}

function publicDisplaySignature(assetId,expiresAt) {
  if(!process.env.AUTH_SECRET)throw new Error("AUTH_SECRET is required for signed asset URLs.");
  return createHmac("sha256",process.env.AUTH_SECRET).update(`display:${assetId}:${expiresAt}`).digest("base64url");
}

export function createSignedAssetUrl(origin,assetId,userId,sessionVersion,ttlSeconds=3600) {
  const expiresAt=Math.floor(Date.now()/1000)+ttlSeconds;
  const signature=assetSignature(assetId,userId,sessionVersion,expiresAt);
  const url=new URL(`/api/uploads/${assetId}/file`,origin);
  url.searchParams.set("uid",userId);
  url.searchParams.set("sv",String(sessionVersion));
  url.searchParams.set("exp",String(expiresAt));
  url.searchParams.set("sig",signature);
  return url.toString();
}

export function verifySignedAssetUrl(assetId,{userId,sessionVersion,expiresAt,signature}) {
  const version=Number(sessionVersion);
  const expiry=Number(expiresAt);
  if(!assetId||!userId||!Number.isInteger(version)||!Number.isInteger(expiry)||expiry<=Math.floor(Date.now()/1000)||!signature)return null;
  const expected=assetSignature(assetId,userId,version,expiry);
  const suppliedBuffer=Buffer.from(signature);
  const expectedBuffer=Buffer.from(expected);
  if(suppliedBuffer.length!==expectedBuffer.length||!timingSafeEqual(suppliedBuffer,expectedBuffer))return null;
  return {userId,sessionVersion:version,expiresAt:expiry};
}

export function createPublicDisplayAssetUrl(origin,assetId,ttlSeconds=3600) {
  const expiresAt=Math.floor(Date.now()/1000)+ttlSeconds;
  const url=new URL(`/api/uploads/${assetId}/file`,origin);
  url.searchParams.set("displayExp",String(expiresAt));
  url.searchParams.set("displaySig",publicDisplaySignature(assetId,expiresAt));
  return url.toString();
}

export function verifyPublicDisplayAssetUrl(assetId,{expiresAt,signature}) {
  const expiry=Number(expiresAt);
  if(!assetId||!Number.isInteger(expiry)||expiry<=Math.floor(Date.now()/1000)||!signature)return false;
  const expected=publicDisplaySignature(assetId,expiry);
  const suppliedBuffer=Buffer.from(signature);
  const expectedBuffer=Buffer.from(expected);
  return suppliedBuffer.length===expectedBuffer.length&&timingSafeEqual(suppliedBuffer,expectedBuffer);
}
import { createHmac, timingSafeEqual } from "node:crypto";
