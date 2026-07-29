# Mobile user search API

## Search users

```http
GET /api/users/search?q=<query>
Authorization: Bearer <sessionToken>
```

`q` is matched case-insensitively as a partial value against both the public
user ID and display name. The authenticated caller is excluded. Deleted
accounts are excluded and the response is capped at 20 users.

An empty or whitespace-only query returns a successful empty list.

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "publicId": "USR-2048",
        "name": "Sarah Jenkins",
        "profileImage": "https://cdn.example.com/profiles/sarah.jpg"
      }
    ]
  }
}
```

Only `publicId`, `name`, and `profileImage` are exposed. Private account,
contact, financial, session, and onboarding fields are never returned.

Example:

```js
const response = await fetch(
  `${API_BASE_URL}/api/users/search?q=${encodeURIComponent(query)}`,
  { headers: { Authorization: `Bearer ${sessionToken}` } },
);
const result = await response.json();
return result.data?.users ?? [];
```
