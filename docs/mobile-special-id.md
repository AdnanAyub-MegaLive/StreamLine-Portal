# Mobile Special ID integration

The permanent account key remains `normalId`. The app should display `id`, which is the active Special ID when one exists and otherwise equals `normalId`.

`POST /api/users/login` and `GET /api/users/session/status` return:

```json
{
  "id": "VIP55",
  "normalId": "USR-1048",
  "specialId": "VIP55",
  "specialIdExpiresAt": "2026-08-03T12:00:00.000Z"
}
```

After expiry, the status endpoint returns `id` equal to `normalId`, with `specialId` and `specialIdExpiresAt` set to `null`. The assignment is then available to another user.

Socket.IO events:

- `special-id:assigned`: immediately replace the displayed ID using `data.effectiveId` or `data.specialId`.
- `special-id:revoked`: immediately restore `data.normalId`.

VIP changes and qualifying coin top-ups can automatically assign an available VIP/SVIP ID based on the rules configured by administrators.
