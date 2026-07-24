# Mobile upload catalogue API

## List available assets

```http
GET /api/uploads/catalog
Authorization: Bearer <sessionToken>
```

The endpoint returns global assets plus assets assigned specifically to the
authenticated user. Assets assigned to other users are never included.

Optional filters:

- `category=BANNERS|FRAMES|ENTRANCES|TAIL_LIGHTS|GIFTS|BADGES|CHAT_BOXES|ROOM_BACKGROUNDS`
- `roomBackground=true` returns only assets enabled for use as room backgrounds.

Example:

```http
GET /api/uploads/catalog?category=ROOM_BACKGROUNDS&roomBackground=true
Authorization: Bearer <sessionToken>
```

```json
{
  "success": true,
  "data": {
    "assets": [
      {
        "id": "AST-A1B2C3D4E5F6",
        "name": "Neon Lounge",
        "category": "ROOM_BACKGROUNDS",
        "fileName": "neon-lounge.webp",
        "mimeType": "image/webp",
        "fileSize": 248310,
        "url": "https://portal.example.com/api/uploads/AST-A1B2C3D4E5F6/file?uid=USR-1048&sv=0&exp=1784883600&sig=...",
        "isRoomBackground": true,
        "assignedUser": null,
        "createdAt": "2026-07-24T08:00:00.000Z"
      }
    ]
  }
}
```

## Load the media file

The catalogue now returns a signed URL that React Native can render directly,
without attaching headers to the separate image request:

```js
const source = {
  uri: asset.url,
};
```

Signed URLs expire after one hour and are bound to the authenticated user and
current session version. Refresh the catalogue to receive a new URL when one
expires. Sending the Bearer token in the file request is still supported.

The hostname in the returned URL is based on the catalogue request. A physical
device must call the API through the computer's LAN address, not `localhost`.
Set `MOBILE_API_BASE_URL` when a fixed externally reachable API origin is
required.

Files are stored in PostgreSQL and streamed with their original MIME type.
The current maximum upload size is 15 MB.
