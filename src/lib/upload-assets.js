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
