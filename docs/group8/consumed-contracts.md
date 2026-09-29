# Contracts Group 8 consumes (Groups 5, 6, 7)

Jira: USMG8-36, USMG8-37, USMG8-38 (S1-04.1-3), USMG8-105, USMG8-107, USMG8-109 (S2-06).
Recorded from each provider's published reference document. "Open points" must be confirmed
with the provider team before the contract is marked agreed.

## Group 5 - Identity & Directory (eligibility for registration, announcement targeting)

Source: *Identity Service API Reference* (Group 5).

| Item | Value |
|---|---|
| Endpoint | `GET /api/v1/validation/users/{user_id}/eligibility` |
| Query | `required_role`, `relationship` (`AFFILIATION` / `RESPONSIBILITY`), `department_id` / `faculty_id` / `service_unit_id` |
| Auth | `Authorization: Bearer <token>` - forward the calling user's token |
| 200 body | `data.eligible`, `data.roles`, `data.account_status`, `data.reasons[]`, `data.message`, `data.checks`, `data.affiliation {department_id, faculty_id, ...}` |
| Reason codes | `ACCOUNT_INACTIVE`, `ROLE_NOT_HELD`, `NO_AFFILIATION`, `AFFILIATION_MISMATCH`, `NO_MATCHING_RESPONSIBILITY`, `RESPONSIBILITY_INACTIVE` |
| Errors | 401 `INVALID_TOKEN`, 404 `USER_NOT_FOUND`, 422 `VALIDATION_ERROR`, 503 `DEPENDENCY_UNAVAILABLE` (treat as unknown, **not eligible**), 502 `DEPENDENCY_ERROR` |
| Tokens | RS256 JWT, 60 min; verify via `GET /.well-known/jwks.json` |

**Group 8 usage.** event-service calls it before confirming a registration (BR8-05) and maps
`eligible=false` to 403 with the reason message. 503 -> registration not confirmed, 503 returned to
the frontend (FR8-19). communication-feedback-service uses the caller's roles/affiliation to filter
announcements (BR8-06).

**Open points.** (1) A test account per role for integration testing (S2-06.1).
(2) Whether faculty/department IDs in Group 8 audience rules use Group 5's `dep-cs` style IDs.
(3) Shared frontend must store and send the JWT - see "Known dependencies" in `../GROUP8_FRONTEND.md`.

## Group 6 - Facilities & Resources (event venue validation)

Source: *Group 6 Facility Venue Validation Integration Spec* and *API Reference*.

| Item | Value |
|---|---|
| Endpoint (numeric ID) | `GET /api/resources/{id}/validate/group8` |
| Endpoint (resource code, e.g. `LAB-101`) | `GET /api/resources/code/{code}/validate` |
| 200 body | `data.active`, `data.available`, `data.capacity`, `data.message` |
| Valid venue | `active && available`; event capacity must not exceed `data.capacity` |

**Group 8 usage.** event-service checks the venue when an organizer asks (frontend "Check venue"
-> `GET /events/venues/{resourceId}/validation`) and again when publishing (FR8-17). Group 6
unavailable -> 503 to the frontend, event stays DRAFT.

**Open points.** (1) Whether Group 8 stores the numeric ID or the resource code (the frontend
accepts codes such as `RES-204`). (2) Whether a time-slot availability check is needed for the
event schedule, not only the static active/available flags.

## Group 7 - Service Requests & Work Orders (service feedback eligibility)

Source: *Group 7 Provides to Group 8* (26 Sep 2026).

| Item | Value |
|---|---|
| Endpoint | `GET /api/work-orders/by-request/{requestId}` (work-order-service) |
| Fields | `requestId`, `status`, `resolvedTime`, `closedTime`, `requesterId` |
| Eligible statuses | `RESOLVED`, `CLOSED`; `REJECTED` = not eligible; anything else = not yet eligible |
| Ownership check | `requesterId` must equal the feedback submitter |
| Errors | `{ timestamp, status, error, message, path }` |

**Group 8 usage.** communication-feedback-service calls it before returning a feedback form or
accepting a response for a service request (BR8-07). The frontend shows the reason for each status
(`explainServiceRequestEligibility` in `src/services/group8/feedbackService.ts`).

**Open points.** (1) Group 7 still has to expose the read-only route for Group 8's caller identity
(currently behind Group 7's internal service role). (2) How Group 8 learns which requests belong to a
user for the Feedback Center list - via notification triggers from Group 7, or a list endpoint.

## Contract status

| Provider | Contract published | Group 8 client ready | Agreed with provider |
|---|---|---|---|
| Group 5 | Yes | Frontend ready; backend adapter by Backend Dev | Pending open points |
| Group 6 | Yes | Frontend ready; backend adapter done (USMG8-108) | Pending open points |
| Group 7 | Yes | Frontend status mapping ready | Pending route exposure |
