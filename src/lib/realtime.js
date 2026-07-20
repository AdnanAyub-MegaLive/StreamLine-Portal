import "server-only";

export function emitToUser(publicId,event,payload) {
  globalThis.portalIo?.to(`user:${publicId}`).emit(event,payload);
}

export function emitToAudioRoom(roomId,event,payload) {
  globalThis.portalIo?.to(`audio-room:${roomId}`).emit(event,payload);
}
