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
  return {
    id:asset.publicId,
    name:asset.name,
    category:asset.category,
    fileName:asset.fileName,
    mimeType:asset.mimeType,
    fileSize:asset.fileSize,
    url,
    isRoomBackground:asset.isRoomBackground,
    assignedUser:asset.assignedUser?{
      id:asset.assignedUser.publicId,
      name:asset.assignedUser.name,
      profileImage:asset.assignedUser.profileImage,
    }:null,
    createdAt:asset.createdAt.toISOString(),
  };
}

function assetSignature(assetId,userId,sessionVersion,expiresAt) {
  if(!process.env.AUTH_SECRET)throw new Error("AUTH_SECRET is required for signed asset URLs.");
  return createHmac("sha256",process.env.AUTH_SECRET).update(`${assetId}:${userId}:${sessionVersion}:${expiresAt}`).digest("base64url");
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
import { createHmac, timingSafeEqual } from "node:crypto";
