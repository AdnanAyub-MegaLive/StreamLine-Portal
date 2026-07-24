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
        "url": "https://portal.example.com/api/uploads/AST-A1B2C3D4E5F6/file",
        "isRoomBackground": true,
        "assignedUser": null,
        "createdAt": "2026-07-24T08:00:00.000Z"
      }
    ]
  }
}
```

## Load the media file

Request the returned `url` with the same Bearer token. React Native image
components can pass it through their source headers:

```js
const source = {
  uri: asset.url,
  headers: { Authorization: `Bearer ${sessionToken}` },
};
```

Files are stored in PostgreSQL and streamed with their original MIME type.
The current maximum upload size is 15 MB.
