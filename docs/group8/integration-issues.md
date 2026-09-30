# Group 8 integration issues (Sprint 3)

Jira: USMG8-132, USMG8-161, USMG8-209 (S3/S4 Team Lead integration). Date: 30 Sep 2026.
Found by comparing the shared frontend, the Group 8 backends
(`EventManagement-Uni-Service-Management-System_Backend`,
`Notification-and-Feedback-Uni-Service-Management-System_Backend`) and `university-api-gateway`
at their latest `main`. Severity: **High** = blocks the integrated demo, **Medium** = wrong or missing
behaviour, **Low** = worked around in the frontend.

## Resolved since the last review

| Item | Resolution |
|---|---|
| F1 JWT not sent by the shared `apiFetch` | Group 5 now stores the token and sends `Authorization: Bearer` (merged to `main`). |
| F2 session lost on refresh (USMG8-160) | Group 5 now restores the session from `sessionStorage`. |
| F8 `status === 24` in `apiClient.ts` | Fixed to `204` by Group 5. |
| Frontend role names vs Group 5 roles | Group 8 frontend now uses Group 5 role names (`EVENT_ORGANIZER`, `ACADEMIC_STAFF`, `ADMINISTRATIVE_STAFF`, ...) matching event-service authorization. |
| Frontend vs event-service API | Frontend integrated with the frozen event-service contract (`docs/event-service-openapi.json`) - paths, methods, fields, LocalDateTime and eligibility-rule JSON. |

## Status update - 30 Sep 2026 (afternoon)

| Item | Status |
|---|---|
| GW-1, GW-5 | **Fixed** - gateway PR #2 routes event-service and communication-feedback-service separately; both are connected on the deployed gateway (`/gateway/routes`, protected routes answer 401 without a token). |
| GW-2 | Open - `/api/v1/announcements`, `/notifications`, `/feedback` are forwarded unchanged, but the service serves `/api/...`. |
| GW-3 | Open - `/api/v1/engagement-dashboard/summary` answers `ROUTE_NOT_FOUND` (the frontend shows labelled demo data). |
| CF-5 | Partly fixed - eligibility path now points at Group 5 (`/api/v1/validation/users/{userId}/eligibility`); `user-path` still `/api/users/{userId}`. |
| CF-1, CF-2, CF-9, CF-10 | Still open on `main`. |

## Open - API Gateway (owner: gateway team; Group 8 Team Lead to raise)

| # | Sev | Issue | Proposed fix |
|---|---|---|---|
| GW-1 | **High** | One `GROUP8_SERVICE_URL` for two Group 8 services, so events and communications cannot both be routed. | Two variables and routes: `GROUP8_EVENT_SERVICE_URL` for `/api/v1/events`, `/api/v1/registrations`; `GROUP8_COMMUNICATION_SERVICE_URL` for announcements, notifications, feedback, engagement. |
| GW-2 | **High** | communication-feedback-service serves `/api/...`, not `/api/v1/...`. | Use the gateway's `_versioned(...)` rewrite for `announcements`, `notifications`, `feedback`. |
| GW-3 | Medium | Engagement is served at `/api/engagement-dashboard/summary`; the gateway lists `/api/v1/engagement`. | Route `/api/v1/engagement-dashboard` -> `/api/engagement-dashboard`. |
| GW-4 | Low | `/api/notifications/trigger` is service-to-service (X-Service-Key). | Do not expose it to browsers, or expose it only for Group 6/7 service calls. |
| GW-5 | **High** | Deployed gateway (`university-api-gateway.onrender.com`, checked 30 Sep 2026): only Identity is connected; `GROUP8_SERVICE_URL` is not configured, so every Group 8 route answers `ROUTE_NOT_FOUND`. | Deploy both Group 8 services and set their URLs once GW-1/GW-2 are in place. |

## Open - communication-feedback-service (owners: Kasun / Isuru)

| # | Sev | Issue | Proposed fix |
|---|---|---|---|
| CF-1 | **High** | Verifies tokens with an HMAC shared secret (`jwt.secret`); Group 5 issues RS256 tokens verified through JWKS. Every real login is rejected. | Verify like event-service: RS256 via `{GROUP5}/.well-known/jwks.json`, check `iss`/`aud`. |
| CF-2 | **High** | Announcements and feedback parse the user id as a UUID; Group 5 ids look like `usr-student-001`, so they return 401 `INVALID_USER_ID`. | Store user ids as strings (`varchar(64)`), as notifications already do. |
| CF-3 | Medium | No role checks: any signed-in user can create announcements and feedback forms (BR8-09). | Read `roles` from the token; allow ADMIN / ADMINISTRATIVE_STAFF for announcements, organizer roles for forms. |
| CF-4 | Medium | Group 7 eligibility path `/api/feedback-eligibility/{type}/{id}` does not exist; Group 7 provides `GET /api/work-orders/by-request/{requestId}`. | Call the Group 7 contract (RESOLVED/CLOSED + requester match). |
| CF-5 | Medium | User directory path `/api/users/{id}` does not match Group 5 (`/api/v1/validation/users/{id}`). | Use the Group 5 validation endpoint. |
| CF-6 | Medium | Venue lookup `/api/facilities/{id}` does not match Group 6 (`/api/resources/code/{code}/validate`). | Use the Group 6 contract. |
| CF-7 | Medium | No endpoint for "my eligible activities", "my announcements/drafts", audience preview, feedback summary, mark-all-read. | Add them, or keep the frontend fallbacks below. |
| CF-8 | Low | Errors are `{ code }` only. | Frontend maps codes to messages (`g8Api.ts`); add `message` for other clients. |
| CF-9 | **High** | The trigger rejects `type: LEGACY` (400 `INVALID_NOTIFICATION_TYPE`) and the only accepted types are Group 8 event types; `relatedId` must be a UUID unless `relatedType` is `EXTERNAL`. Groups 6 and 7 therefore cannot send a meaningful notification. | Add `RESERVATION_STATUS` and `SERVICE_REQUEST_STATUS` types; accept string related ids. |
| CF-10 | **High** | Creating a feedback form fails with 500: the UUID `activityId` is written as binary into the `char(36)` `activity_id` column (MySQL error 1366 "Incorrect string value"). No feedback can be collected on MySQL. | Map the UUID columns as `char(36)` strings (e.g. `@JdbcTypeCode(SqlTypes.CHAR)`), or change the migration. |
| CF-11 | Medium | Listing announcements needs the recipient directory; without `USER_DIRECTORY_BASE_URL` it returns 503 `RECIPIENT_DIRECTORY_NOT_CONFIGURED` (and CF-5's path is wrong). | Configure it against Group 5 (after CF-5). |

**Evidence (30 Sep 2026, service run locally from `main` with Docker):** a Group 5-shaped RS256 token
(minted by event-service's dev issuer, `sub=usr-student-001`) gets **403** on `/api/notifications`,
`/api/announcements` and `/api/feedback/forms` (CF-1 - note 403, not 401). With an HS256 token signed by the
service's own secret and `sub=usr-student-001`, announcements return **401 `INVALID_USER_ID`** (CF-2).
Trigger with `LEGACY` -> 400 (CF-9); `POST /api/feedback/forms` -> 500 (CF-10).

## Open - event-service (owner: harshana)

| # | Sev | Issue | Proposed fix |
|---|---|---|---|
| EV-1 | Low | No online meeting link field. | Add `onlineLink` (returned only to registrants/organizer). |
| EV-2 | Low | Registration counts only via organizer summary; students cannot see places left. | Optionally add `remainingSeats` to `EventResponse`. |
| EV-3 | Low | Summary has counts, not registrant names. | Optional `registrants[]` for the organizer. |

## Frontend status per service

| Area | Status |
|---|---|
| Events, registrations, organizer tools | **Integrated and verified against the real event-service** (run locally from `main` with MySQL, `dev,seed` profiles): list, detail, register, capacity-full, my registrations, cancel, create, publish, summary, edit, cancel event |
| Venue check | **Integrated** with Group 6 through the gateway |
| Announcements, notifications | Integration in progress (Mahela); needs GW-1/2 and CF-1/2 to work end to end |
| Feedback, engagement | Integration in progress (Ravindu); needs GW-1/2/3 and CF-1/2/4 |

Until GW-1/2 and CF-1/2 are fixed, the communication screens keep showing labelled demo data
(the gateway answers `ROUTE_NOT_FOUND`), which is the designed behaviour.
