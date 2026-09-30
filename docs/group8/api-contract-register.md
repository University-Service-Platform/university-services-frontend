# Group 8 API contract register

Jira: USMG8-165 (S3-07.1). Status: **v1.1 - aligned with the implemented services** (30 Sep 2026).
Breaking changes need a change request (below). Browser paths go through the API Gateway base
`/api/v1`; the gateway forwards to each service (see [integration-issues.md](integration-issues.md) GW-1..3).

## event-service (frozen contract: `docs/event-service-openapi.json` in the backend repo)

Serves both `/api/...` and `/api/v1/...`. Errors: `{ success: false, error: { code, message } }`.

| # | Method | Path | Roles | Notes |
|---|---|---|---|---|
| E1 | GET | `/events?status=&from=&to=&upcoming=&mine=&page=&size=` | any signed-in | Drafts only for managers |
| E2 | GET | `/events/{id}` | any signed-in | 403 `NOT_VISIBLE` |
| E3 | POST | `/events` | EVENT_ORGANIZER, ACADEMIC_STAFF, ADMIN | Creates DRAFT |
| E4 | PATCH | `/events/{id}` | same | Partial update |
| E5 | PATCH | `/events/{id}/publish` | same | Group 6 venue check: 409 `VENUE_NOT_AVAILABLE`, 400 `VENUE_NOT_FOUND`, 503 `GROUP6_UNAVAILABLE` |
| E6 | PATCH | `/events/{id}/cancel` | same | Cancels registrations, notifies |
| E7 | PATCH | `/events/{id}/complete` | same | 400 `EVENT_NOT_STARTED` |
| E8 | POST | `/events/{id}/registrations` | any signed-in | 403 `NOT_ELIGIBLE`, 409 `CAPACITY_REACHED`/`ALREADY_REGISTERED`, 400 `REGISTRATION_CLOSED`, 503 `GROUP5_UNAVAILABLE` |
| E9 | GET | `/events/{id}/registrations` | organizer roles + ADMINISTRATIVE_STAFF | Counts summary |
| E10 | GET | `/events/summary` | ADMIN, ADMINISTRATIVE_STAFF | Totals by status |
| E11 | GET | `/registrations/mine` | any signed-in | |
| E12 | PATCH | `/registrations/{id}/cancel` | owner | 400 `CANCELLATION_CLOSED` after the event starts |

Event body: `title, description, venue (Group 6 code), online, scheduleStart, scheduleEnd,
registrationOpenAt, registrationCloseAt (LocalDateTime, no zone), capacity, eligibilityRule`
(JSON string: `{"all": true}` or `{"roles": [...], "departmentId": "CS", "facultyId": "FSC"}`).

## communication-feedback-service

Serves `/api/...`. Errors: `{ code }`.

| # | Method | Path | Consumers | Notes |
|---|---|---|---|---|
| C1 | GET | `/announcements` | frontend | Announcements visible to the caller |
| C2 | POST | `/announcements` | frontend | `{ title, content, audienceType, ruleValue }` - one rule value |
| C3 | POST | `/announcements/{id}/publish` | frontend | Owner only |
| C4 | POST | `/announcements/{id}/archive` | frontend | Owner only |
| C5 | GET | `/notifications?unreadOnly=&page=&size=` | frontend | Spring `Page` (`content[]`) |
| C6 | PATCH | `/notifications/{id}/read` | frontend | Recipient only |
| C7 | POST | `/notifications/trigger` | **Groups 6, 7**, event-service | `X-Service-Key`; see [notification-api-for-groups-6-7.md](notification-api-for-groups-6-7.md) |
| C8 | POST | `/feedback/forms` | frontend (organizers) | `{ activityType, activityId (UUID), title, questionsJson }` |
| C9 | GET | `/feedback/forms` | frontend | Active forms |
| C10 | GET | `/feedback/forms/{formId}` | frontend | |
| C11 | POST | `/feedback/forms/{formId}/responses` | frontend | `{ rating 1-5, comment }`; 403 `FEEDBACK_NOT_ELIGIBLE`, 409 `FEEDBACK_ALREADY_SUBMITTED` |
| C12 | GET | `/feedback/forms/{formId}/responses` | frontend | Form creator only |
| C13 | GET | `/engagement-dashboard/summary` | frontend | Counts and average rating |

## Consumed by Group 8

See [consumed-contracts.md](consumed-contracts.md): Group 5 eligibility and JWKS, Group 6 venue
validation, Group 7 completion status.

## Change rules

| Change | Allowed? | Process |
|---|---|---|
| Add an optional response field or a new endpoint | Yes | Add it here; bump the minor version; tell affected teams |
| Rename/remove a field or endpoint, change a status code or meaning | **Only with a change request** | Jira change request with impact per consumer, agreed by the affected leads, before merging |
| Fix to match this register | Yes | Treat as a defect |

## Version history

| Version | Date | Change |
|---|---|---|
| 1.0 | 27 Sep 2026 | Register created from the frontend draft contract |
| 1.1 | 30 Sep 2026 | Replaced with the implemented event-service (frozen OpenAPI) and communication-feedback-service endpoints |
