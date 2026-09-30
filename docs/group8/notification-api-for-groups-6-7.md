# Group 8 -> Groups 6 and 7: Notification Trigger API

Jira: USMG8-96 (S2-04.7). Provider: Group 8, communication-feedback-service
(`Notification-and-Feedback-Uni-Service-Management-System_Backend`, `NotificationController`).
Receivers: Group 6 (reservation-service) and Group 7 (service-request-service, work-order-service).
Contract version: **1.1** (updated 30 Sep 2026 to match the implemented service; see
[api-contract-register.md](api-contract-register.md)).

Group 8 shows in-app notifications to users (header bell and Notification Center). When something
in your workflow changes that the user should know about, call this endpoint once from your service.

## 1. Endpoint

| Item | Value |
|---|---|
| Method / path | `POST /api/notifications/trigger` on communication-feedback-service (service-to-service) |
| Auth | Header `X-Service-Key: <shared service key>` - the Group 8 Team Lead gives each team its key privately; never put it in a frontend or a repository |
| Content type | `application/json` |
| Idempotency | `idempotencyKey` in the body: repeating a key returns the original notification (`200`) instead of creating a duplicate |

## 2. Request body

| Field | Type | Required | Rules |
|---|---|---|---|
| `recipientId` | string (max 64) | yes | Group 5 user id of the person to notify, e.g. `usr-student-001` |
| `type` | enum | yes | Use `LEGACY` for Group 6/7 updates (the other values are Group 8 event types) |
| `message` | string (max 2000) | yes | Plain text the user sees, e.g. "Your reservation of Seminar Room 2 on 3 Oct, 10:00-12:00 was approved." |
| `relatedType` | enum | yes | Group 6: `RESERVATION`. Group 7: `SERVICE_REQUEST` |
| `relatedId` | UUID | no | Only if your record id is a UUID; otherwise put your id in the message |
| `sourceService` | string (max 64) | yes | e.g. `reservation-service`, `service-request-service`, `work-order-service` |
| `idempotencyKey` | string (max 200) | yes | `<service>-<recordId>-<status>`, e.g. `g6-RSV-7781-APPROVED` |

### Group 6 example - reservation approved

```http
POST /api/notifications/trigger
X-Service-Key: <your key>
Content-Type: application/json

{
  "recipientId": "usr-student-001",
  "type": "LEGACY",
  "message": "Your reservation of Seminar Room 2 on 3 Oct, 10:00-12:00 was approved.",
  "relatedType": "RESERVATION",
  "sourceService": "reservation-service",
  "idempotencyKey": "g6-RSV-7781-APPROVED"
}
```

### Group 7 example - service request resolved

```http
POST /api/notifications/trigger
X-Service-Key: <your key>
Content-Type: application/json

{
  "recipientId": "usr-student-001",
  "type": "LEGACY",
  "message": "Your request REQ-2026-004 \"Software license request for MATLAB\" was marked Resolved.",
  "relatedType": "SERVICE_REQUEST",
  "sourceService": "work-order-service",
  "idempotencyKey": "g7-REQ-2026-004-RESOLVED"
}
```

## 3. Responses

| Status | Body | What you should do |
|---|---|---|
| `201 Created` | the notification `{ id, recipientId, type, message, relatedType, relatedId, sourceService, idempotencyKey, isRead, createdAt }` | Nothing |
| `200 OK` | the original notification (same `idempotencyKey`) | Nothing - not an error |
| `400` | `{ "code": "INVALID_NOTIFICATION_REQUEST" \| "INVALID_NOTIFICATION_TYPE" \| "VALIDATION_FAILED" }` | Fix the payload; do not retry unchanged |
| `401` | `{ "code": "INVALID_SERVICE_KEY" }` | Check the `X-Service-Key` |
| `404` | `{ "code": "NOTIFICATION_RECIPIENT_NOT_FOUND" }` | Recipient unknown to Group 5 - do not retry; log it |
| `503` | `{ "code": "RECIPIENT_DIRECTORY_UNAVAILABLE" }` | Retry later (e.g. 3 tries: 5 s, 30 s, 2 min) |

## 4. Rules

- One notification per meaningful status change the user cares about (approved, rejected, in progress,
  resolved, closed) - not for internal steps.
- Your workflow must not fail because a notification failed: send it after your own transaction
  commits, and retry `503`s in the background.
- Group 8 never reads your database; the user sees only `message`.

## 5. Checklist for your team

- [ ] Get your service key from the Group 8 Team Lead
- [ ] Map your status changes to messages
- [ ] Send a stable `idempotencyKey` on every call
- [ ] Test `201`, repeated key `200`, `400` and `401` against Group 8 in the integrated environment
- [ ] Tell the Group 8 Team Lead when your trigger is live, so both sides can mark the dependency done

Contact: Group 8 Team Lead (Thaveesha).
