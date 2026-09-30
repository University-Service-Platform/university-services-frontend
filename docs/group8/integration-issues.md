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

## Open - event-service (owner: harshana)

| # | Sev | Issue | Proposed fix |
|---|---|---|---|
| EV-1 | Low | No online meeting link field. | Add `onlineLink` (returned only to registrants/organizer). |
| EV-2 | Low | Registration counts only via organizer summary; students cannot see places left. | Optionally add `remainingSeats` to `EventResponse`. |
| EV-3 | Low | Summary has counts, not registrant names. | Optional `registrants[]` for the organizer. |

## Frontend status per service

| Area | Status |
|---|---|
| Events, registrations, organizer tools | **Integrated** with event-service (this branch) |
| Venue check | **Integrated** with Group 6 through the gateway |
| Announcements, notifications | Integration in progress (Mahela); needs GW-1/2 and CF-1/2 to work end to end |
| Feedback, engagement | Integration in progress (Ravindu); needs GW-1/2/3 and CF-1/2/4 |

Until GW-1/2 and CF-1/2 are fixed, the communication screens keep showing labelled demo data
(the gateway answers `ROUTE_NOT_FOUND`), which is the designed behaviour.
