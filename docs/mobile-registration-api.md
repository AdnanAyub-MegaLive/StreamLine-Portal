# Mobile user registration API

## Endpoint

`POST /api/users/register`

Send the request with `Content-Type: application/json`. The endpoint is public and creates a regular listener account. VIP level, role, coin balance, and account status cannot be assigned by the mobile client.

## Request body

```json
{
  "name": "Aisha Khan",
  "phone": "+92 300 1234567",
  "email": "aisha@example.com",
  "country": "Pakistan",
  "profileImage": "https://cdn.example.com/profiles/aisha.jpg",
  "device": {
    "macAddress": "stable-device-identifier",
    "lastLoginIp": "192.0.2.10",
    "location": "Lahore, Pakistan",
    "platform": "Android",
    "deviceName": "Pixel 8"
  }
}
```

Only `name` and `phone` are required. Email is optional. Phone numbers and email addresses must be unique across users. The complete `device` object is optional; when supplied, `device.macAddress` must contain either a MAC address or another stable device identifier.

## React Native example

```js
const response = await fetch(`${API_BASE_URL}/api/users/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(registration),
});

const result = await response.json();
if (!response.ok) throw new Error(result.error?.message || "Registration failed");
return result.data.user;
```

Use the computer's LAN address during physical-device development, for example `http://192.168.88.13:3000`. Android emulators can normally reach the host at `http://10.0.2.2:3000`; `localhost` points to the mobile device or emulator itself.

## Responses

- `201`: user created; returns `data.user`.
- `400`: malformed JSON.
- `409`: phone number or email already registered.
- `422`: validation failed; inspect `error.fields`.
- `500`: database or server failure.

Set `MOBILE_APP_ORIGIN` in `.env.local` when a browser-based client needs CORS restricted to a specific origin. Native React Native requests are not subject to browser CORS.
