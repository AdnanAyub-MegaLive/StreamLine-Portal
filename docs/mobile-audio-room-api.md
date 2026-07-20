# Mobile audio room records

Use the signed mobile `sessionToken` returned by registration/login for every request.

## Create or update a room record

`POST /api/audio-rooms`

```json
{
  "roomId": "AUDIO-ROOM-2048",
  "title": "Late Night Lounge",
  "status": "LIVE",
  "liveAudioUrl": "https://media.example.com/live/2048.m3u8",
  "recordingUrl": null,
  "participantCount": 42,
  "startedAt": "2026-07-20T08:00:00.000Z",
  "endedAt": null
}
```

Headers:

```text
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

Send the same `roomId` as participants change, when a recording URL becomes available, and when the room changes to `ENDED`. The backend upserts the record and prevents the mobile app from overriding administrator blocks.

`GET /api/audio-rooms` returns the authenticated user’s latest 100 rooms.

## Socket.IO integration

After connecting with the mobile session token, join the room channel:

```js
socket.emit("audio-room:join", { roomId }, (result) => {
  if (!result.success) leaveRoom();
});

socket.on("audio-room:joining-disabled", stopNewJoins);
socket.on("audio-room:blocked", showRoomBlockedScreen);
socket.on("audio-room:terminated", closeRoomImmediately);
socket.on("audio-room:deleted", closeRoomImmediately);
```

The app should also process the same events on the owner’s user socket. Blocking and termination are effective immediately and are recorded in portal Audit Logs.
