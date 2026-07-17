# Mobile Socket.IO session events

The portal serves HTTP and Socket.IO from the same base URL. Registration and `POST /api/users/login` return `data.sessionToken`; keep it in secure device storage and use it for both the socket handshake and session-status request. Login accepts `{ "phone": "+923001234567", "password": "..." }`.

## React Native connection

Install `socket.io-client` in the React Native application and connect after login or registration:

```js
import { io } from "socket.io-client";

const socket = io(API_BASE_URL, {
  auth: { token: sessionToken },
  transports: ["websocket"],
});

socket.on("session:status", handleSessionState);
socket.on("account:banned", showBannedScreen);
socket.on("account:unbanned", removeBannedScreen);
socket.on("session:force-logout", logoutImmediately);

socket.on("connect_error", (error) => {
  if (error.message === "ACCOUNT_BANNED") showBannedScreen({
    success: true,
    data: {
      isBanned: true,
      banReason: error.data?.banReason ?? null,
      banExpiresAt: error.data?.banExpiresAt ?? null,
    },
  });
  if (error.message === "SESSION_REVOKED") logoutImmediately();
});
```

## Session status fallback

Call `GET /api/users/session/status` with `Authorization: Bearer <sessionToken>`. Successful socket events and the endpoint use this shape:

```json
{
  "success": true,
  "data": {
    "sessionVersion": 0,
    "forcedLogoutAt": null,
    "isBanned": false,
    "banReason": null,
    "banExpiresAt": null
  }
}
```

The app should keep the socket connected for immediate enforcement and call the status endpoint on cold start, foreground resume, and before entering protected screens. A timed ban emits `account:unbanned` when it expires. Force logout and password reset emit `session:force-logout`, increment `sessionVersion`, then disconnect the socket.
