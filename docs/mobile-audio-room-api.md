# Mobile audio-room API

## Persistent room identity

Each user can own exactly one audio-room ID. The backend assigns this ID and React Native must store/use the `roomId` returned by the API. Do not generate a room ID in the app.

When the room becomes empty, its Socket.IO runtime and live audio resource are released, while the database retains the assigned ID with status `IDLE`. Starting again reuses the same ID. Only an administrator's **Delete permanently** action removes that identity; the user's next start then receives a new ID.

All requests require `Authorization: Bearer <sessionToken>`.

## Get the assigned room

`GET /api/audio-rooms`

Returns `data.room`, or `null` before the first room is created. `data.rooms` is retained as a compatibility array containing zero or one room.

## Create or start the room

`POST /api/audio-rooms`

```json
{
  "action": "START",
  "title": "Late Night Music Lounge",
  "liveAudioUrl": "https://media.example.com/live/stream.m3u8",
  "participantCount": 1
}
```

The first call returns HTTP `201`, assigns a system-generated ID, and sets `reused: false`. Later calls return HTTP `200`, reuse the assigned ID, and set `reused: true`.

```json
{
  "success": true,
  "data": {
    "roomId": "ROOM-7F30A921B8C4",
    "reused": true,
    "room": {
      "roomId": "ROOM-7F30A921B8C4",
      "status": "LIVE"
    }
  }
}
```

Any `roomId` sent by older app builds is ignored; the backend-owned ID is authoritative.

## Owner exits or ends the room

```json
{
  "action": "EXIT",
  "recordingUrl": "https://media.example.com/recordings/session.mp3"
}
```

`EXIT`, `EMPTY`, and `END` all change the room to `IDLE`, set participants to zero, clear the live-audio URL, preserve an optional recording URL, and retain the room ID.

The Socket.IO server also performs this automatically when the final socket leaves or disconnects. It emits `audio-room:idle` to the owner:

```json
{
  "success": true,
  "data": {
    "roomId": "ROOM-7F30A921B8C4",
    "status": "IDLE",
    "roomIdRetained": true
  }
}
```

## Socket.IO

Join only after the START response:

```js
socket.emit("audio-room:join", { roomId: result.data.roomId }, callback);
socket.emit("audio-room:leave", { roomId: result.data.roomId }, callback);
```

Listen for administrator and lifecycle events:

- `audio-room:idle`
- `audio-room:joining-disabled`
- `audio-room:blocked`
- `audio-room:terminated`
- `audio-room:deleted`

After `audio-room:deleted`, discard the old ID locally. The next `START` request creates and returns a new persistent ID.
