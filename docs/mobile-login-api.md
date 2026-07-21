# Mobile user login API

## Endpoint

`POST /api/users/login`

Every login requires credentials plus current device information. The backend derives the login IP from the HTTP request; the mobile app must send the current location and a stable device identifier.

```json
{
  "phone": "+923001234567",
  "password": "MyPass#8",
  "device": {
    "macAddress": "stable-device-or-installation-id",
    "location": "Lahore, Pakistan",
    "platform": "Android",
    "deviceName": "Pixel 8"
  }
}
```

`device.macAddress` and `device.location` are required. Because recent Android and iOS versions may hide the physical MAC address, send a stable app-installation or device identifier when the physical MAC is unavailable. Do not send `lastLoginIp`; the server obtains it from the connection/proxy headers.

## Successful response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "USR-1048",
      "normalId": "USR-1048",
      "specialId": null,
      "name": "Aisha Khan",
      "phone": "+923001234567",
      "email": "aisha@example.com",
      "country": "Pakistan",
      "profileImage": null,
      "role": "LISTENER",
      "status": "ACTIVE",
      "vipLevel": 0
    },
    "login": {
      "ipAddress": "203.0.113.10",
      "macAddress": "stable-device-or-installation-id",
      "location": "Lahore, Pakistan",
      "platform": "Android",
      "deviceName": "Pixel 8",
      "loggedInAt": "2026-07-20T12:00:00.000Z"
    },
    "sessionToken": "..."
  }
}
```

Each successful credential check upserts the matching `Device` record, updates the user's last-login time, and writes an authentication audit log. A valid banned-user login attempt records the same device/login information but returns HTTP `403` with ban details.

Missing device ID or location returns HTTP `422` with `error.fields`.
