# Gift settlement and agency rules

## Platform rules

`GET /api/platform/rules` requires a mobile bearer session and returns the
currently active percentages. The application should use this response for
display only; the backend always recalculates and settles the authoritative
amount.

```json
{
  "success": true,
  "data": {
    "profitSplit": {
      "hostPercent": 40,
      "agencyPercent": 20,
      "companyPercent": 40,
      "normalUserReusablePercent": 40,
      "normalUserCompanyPercent": 60,
      "normalUserWithdrawable": false,
      "hostRequiresAgency": true,
      "version": 1,
      "updatedAt": "2026-07-31T12:00:00.000Z"
    }
  }
}
```

## Send and settle a gift

`POST /api/gifts/send` requires a mobile bearer session.

```json
{
  "recipientId": "USR-2048",
  "giftName": "Rose",
  "quantity": 1,
  "coinValue": "1000",
  "roomId": "ROOM-7F30A921B8C4"
}
```

`coinValue` is the total value deducted for the transaction. Send it as an
integer string so large balances remain precise in JavaScript.

Host recipients must have role `HOST` and an active agency. Their settlement
is credited to a salary balance and the agency commission balance. Normal
users receive only the configured reusable percentage in their coin balance;
they receive no salary balance and cannot withdraw it.

The success response includes `grossCoins`, `hostSalaryCoins`, `agencyCoins`,
`companyCoins`, `reusableCoins`, and `policyVersion`, all derived and committed
atomically by the backend.

Possible business errors include `INSUFFICIENT_COINS`,
`HOST_AGENCY_REQUIRED`, `USER_NOT_FOUND`, and `VALIDATION_ERROR`.

## Administration

Portal administrators manage percentages and one-agency-per-host membership
at `/platform-rules`. Every rules or membership change is written to Audit
Logs. Existing gift settlements retain their original percentage snapshot
when the active policy changes.
