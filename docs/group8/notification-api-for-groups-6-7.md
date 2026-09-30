# Group 8 -> Groups 6 and 7: Notification Trigger API

Jira: USMG8-96 (S2-04.7). Provider: Group 8, communication-feedback-service.
Receivers: Group 6 (reservation-service) and Group 7 (service-request-service, work-order-service).
Contract version: **1.0** (frozen, see [api-contract-register.md](api-contract-register.md)).

> Before sending: confirm with the communication-feedback-service backend owner (Kasun, USMG8-39)
> that the running service matches this document, especially `Idempotency-Key` and the `404` code.

Group 8 shows in-app notifications to users (header bell and Notification Center). When something
in your workflow changes that the user should know about, call this endpoint once. Group 8 validates
it, stores it and shows it to that user only.

## 1. Endpoint

| Item | Value |
|---|---|
| Method / path | `POST /api/v1/notifications` (through the API Gateway) |
| Auth | `Authorization: Bearer <token>` - a service token or the acting user's token forwarded from the request you are handling |
| Content type | `application/json` |
| Idempotency | Send `Idempotency-Key: <your-system>-<entity-id>-<status>` - repeating the same key returns the original notification instead of creating a duplicate |

## 2. Request body

| Field | Type | Required | Rules |
|---|---|---|---|
| `recipientId` | string | yes | Group 5 `user_id` of the person to notify (e.g. the requester) |
| `type` | string | yes | Group 6: `RESERVATION_STATUS`. Group 7: `SERVICE_REQUEST_STATUS` |
| `source` | string | yes | `GROUP6` or `GROUP7` |
| `title` | string | yes | Max 120 chars, e.g. "Reservation approved" |
| `message` | string | yes | Max 500 chars, plain text, no personal data beyond what the recipient already owns |
| `referenceId` | string | recommended | Your record ID (`RSV-7781`, `REQ-2026-004`) - shown to the user and used for de-duplication |

### Group 6 example - reservation approved

```http
POST /api/v1/notifications
Authorization: Bearer eyJ...
Idempotency-Key: g6-RSV-7781-APPROVED
Content-Type: application/json

{
  "recipientId": "usr-student-001",
  "type": "RESERVATION_STATUS",
  "source": "GROUP6",
  "title": "Reservation approved",
  "message": "Your reservation of Seminar Room 2 on 3 Oct, 10:00-12:00 was approved.",
  "referenceId": "RSV-7781"
}
```

### Group 7 example - service request resolved

```http
POST /api/v1/notifications
Authorization: Bearer eyJ...
Idempotency-Key: g7-REQ-2026-004-RESOLVED
Content-Type: application/json

{
  "recipientId": "usr-student-001",
  "type": "SERVICE_REQUEST_STATUS",
  "source": "GROUP7",
  "title": "Service request resolved",
  "message": "Your request REQ-2026-004 \"Software license request for MATLAB\" was marked Resolved.",
  "referenceId": "REQ-2026-004"
}
```

Once a Group 7 request is `RESOLVED` or `CLOSED`, Group 8 also lists it under
"Ready for your feedback" for that requester (see the completion-status contract Group 7 provides).

## 3. Responses

| Status | Meaning | What you should do |
|---|---|---|
| `201 Created` | Stored; body is the notification `{ id, recipientId, type, title, message, source, referenceId, read:false, createdAt }` | Nothing |
| `200 OK` | Same `Idempotency-Key` already processed; body is the original notification | Nothing - not an error |
| `400 VALIDATION_ERROR` | Missing/invalid field; `message` names it | Fix the payload; do not retry unchanged |
| `401` | Missing or expired token | Refresh the token, then retry |
| `403` | Caller not allowed to send this `type`/`source` | Check the `source` value |
| `404 RECIPIENT_NOT_FOUND` | `recipientId` unknown to Group 5 | Do not retry; log it |
| `503 DEPENDENCY_UNAVAILABLE` | Group 8 could not validate the recipient with Group 5 | Retry later (e.g. 3 tries, backoff 5 s / 30 s / 2 min) |

Error body: `{ "timestamp", "status", "error", "message", "path" }` - the same shape Group 7 uses.

## 4. Rules

- One notification per meaningful status change the user cares about (approved, rejected, in progress,
  resolved, closed) - not for internal steps.
- Your workflow must not fail because a notification failed: send it after your own transaction
  commits, and retry `503`s in the background.
- Group 8 never reads your database; everything the user sees comes from `title` and `message`.

## 5. Checklist for your team

- [ ] Map your status changes to the titles/messages you will send
- [ ] Send `Idempotency-Key` on every call
- [ ] Test `201`, repeated key `200`, `400` and `503` against Group 8 in the integrated environment
- [ ] Tell the Group 8 Team Lead when your trigger is live, so both sides can mark the dependency done

Contact: Group 8 Team Lead (Thaveesha).
