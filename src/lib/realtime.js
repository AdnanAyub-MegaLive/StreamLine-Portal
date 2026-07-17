import "server-only";

export function emitToUser(publicId,event,payload) {
  globalThis.portalIo?.to(`user:${publicId}`).emit(event,payload);
}
