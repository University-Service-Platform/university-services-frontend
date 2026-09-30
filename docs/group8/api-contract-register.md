# Group 8 API contract register

Jira: USMG8-165 (S3-07.1). Status: **v1.0 frozen for breaking changes** (sprint plan API freeze
date: 16 Sep 2026). All paths are relative to the API Gateway base `/api/v1`.

## Provided by Group 8

### event-service

| # | Method | Path | Consumers | Version | Notes |
|---|---|---|---|---|---|
| E1 | GET | `/events?status=&search=&scope=` | Shared frontend | 1.0 | Returns only events visible to the caller |
| E2 | GET | `/events/{id}` | Shared frontend | 1.0 | |
| E3 | POST | `/events` | Shared frontend | 1.0 | Creates DRAFT; organizer roles only |
| E4 | PUT | `/events/{id}` | Shared frontend | 1.0 | 409 for cancelled/completed or capacity below confirmed |
| E5 | POST | `/events/{id}/publish` | Shared frontend | 1.0 | Re-validates venue with Group 6 |
| E6 | POST | `/events/{id}/cancel` | Shared frontend | 1.0 | Body `{ reason }`; cancels registrations and notifies |
| E7 | GET | `/events/venues/{resourceId}/validation` | Shared frontend | 1.0 | Proxies Group 6 |
| E8 | POST | `/events/{id}/registrations` | Shared frontend | 1.0 | 403 not eligible, 409 closed/full/duplicate, 503 Group 5 down |
| E9 | GET | `/events/{id}/registrations/summary` | Shared frontend | 1.0 | Organizer only |
| E10 | GET | `/registrations/me` | Shared frontend | 1.0 | |
| E11 | POST | `/registrations/{id}/cancel` | Shared frontend | 1.0 | 409 after deadline |

### communication-feedback-service

| # | Method | Path | Consumers | Version | Notes |
|---|---|---|---|---|---|
| C1 | GET | `/announcements` | Shared frontend | 1.0 | Server-side audience filtering |
| C2 | GET | `/announcements/managed` | Shared frontend | 1.0 | Staff only |
| C3 | POST | `/announcements` | Shared frontend | 1.0 | `{ title, content, audience, publishNow }` |
| C4 | POST | `/announcements/{id}/publish` | Shared frontend | 1.0 | |
| C5 | POST | `/announcements/audience-preview` | Shared frontend | 1.0 | Estimated recipients |
| C6 | GET | `/notifications/me` | Shared frontend | 1.0 | |
| C7 | PATCH | `/notifications/{id}/read` | Shared frontend | 1.0 | |
| C8 | PATCH | `/notifications/me/read-all` | Shared frontend | 1.0 | |
| C9 | POST | `/notifications` | **Groups 6, 7**, event-service | 1.0 | See [notification-api-for-groups-6-7.md](notification-api-for-groups-6-7.md) |
| C10 | GET | `/feedback/activities/me` | Shared frontend | 1.0 | |
| C11 | GET | `/feedback/forms?activityType=&activityId=` | Shared frontend | 1.0 | 409 not eligible / already submitted |
| C12 | POST | `/feedback/responses` | Shared frontend | 1.0 | One per user and activity |
| C13 | GET | `/feedback/summaries?activityType=` | Shared frontend | 1.0 | Staff only |
| C14 | GET | `/engagement/summary` | Shared frontend | 1.0 | Staff only |

Shared error behaviour for all endpoints: 400 validation, 401 session, 403 forbidden, 404 not found,
409 conflict, 503 dependency unavailable (nothing saved). Frontend mapping: `src/services/group8/g8Api.ts`.

## Consumed by Group 8

See [consumed-contracts.md](consumed-contracts.md): Group 5 eligibility, Group 6 venue validation,
Group 7 completion status.

## Change rules after the freeze

| Change | Allowed? | Process |
|---|---|---|
| Add an optional response field | Yes | Note it in this register; bump to 1.1 |
| Add a new endpoint | Yes | Add a row; tell affected teams |
| Rename/remove a field or endpoint, change a status code or meaning | **Only with a change request** | Jira change request (S3-07.4) with impact on each consumer, agreed by the affected teams' leads, before merging |
| Fix to match this register | Yes | Treat as a defect |

Before release, backend owners (event-service: harshana, communication-feedback-service: Kasun)
confirm that Swagger matches this register (USMG8-198).

## Version history

| Version | Date | Change |
|---|---|---|
| 1.0 | 27 Sep 2026 | Register created from implemented frontend clients and the Group 8 draft contracts |
