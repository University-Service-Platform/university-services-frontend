# Group 8 architecture decisions

Jira: USMG8-64 (S1-07.4), USMG8-201 (S4-04.4). Format: context -> decision -> consequences.
Related: [service boundaries](service-boundaries.md), [consumed contracts](consumed-contracts.md),
[frontend guide](../GROUP8_FRONTEND.md).

## ADR-01 Two services, each owning its data

**Context.** Group 8 covers events/registrations and communications/feedback, with different change
rates and consumers (Groups 6 and 7 only need notifications).
**Decision.** `event-service` and `communication-feedback-service`, each with its own schema. No
shared Group 8 database.
**Consequences.** Clear ownership and independent deployment; cross-service data (event titles in
notifications, event completion for feedback) travels over REST and may be slightly stale.

## ADR-02 Notifications via a REST trigger, not a message broker

**Context.** Groups 6 and 7 must notify users in-app. The brief requires REST; messaging is optional.
**Decision.** `POST /notifications` on communication-feedback-service is the single notification
path, used by event-service and by Groups 6/7.
**Consequences.** Simple to integrate and test with Postman. Producers must retry on failure, and
duplicate triggers must be handled idempotently (USMG8-151). RabbitMQ/Kafka can replace the
transport later without changing the Notification model.

## ADR-03 Validation decisions stay on the server

**Context.** Eligibility, capacity, audience visibility and feedback eligibility are business rules
that users could bypass in the browser.
**Decision.** The frontend only pre-checks for clearer messages; event-service and
communication-feedback-service re-check everything, and the frontend displays the server's reason.
Announcement feeds are filtered server-side - no client-side audience filtering.
**Consequences.** Slightly more round trips; no security depends on UI code (BR8-06, BR8-09).

## ADR-04 Dependent-service failure means "not confirmed"

**Context.** Group 5/6/7 may be down (FR8-19, NFR8-04).
**Decision.** If a dependency is unavailable, the Group 8 action is not completed and 503 is returned;
nothing is stored as if it succeeded. The frontend shows which service is unavailable and that
nothing was saved.
**Consequences.** Availability of registration depends on Group 5; data is never corrupted by
guesses.

## ADR-05 Frontend calls the API Gateway only

**Decision.** All Group 8 clients use the shared `apiFetch` with `VITE_API_BASE_URL` (default
`/api/v1`). No service ports or hosts in frontend code.
**Consequences.** One place to configure per environment; the gateway must register Group 8 paths
(`/events`, `/registrations`, `/announcements`, `/notifications`, `/feedback`, `/engagement`).

## ADR-06 Redux only for shared, long-lived state

**Context.** The brief requires Redux; most Group 8 state is page-local.
**Decision.** Redux Toolkit holds the notification inbox (read by the header bell and the Notification
Center) and an activity signal that triggers inbox refresh after user actions. Forms and lists keep
local state.
**Consequences.** Small store, no duplicated server cache; pages refetch on mount.

## ADR-07 Typed results and one error mapping

**Decision.** Every Group 8 call returns `G8Result<T>` (`ok` + data, or `kind` + message) with one
status mapping (400/401/403/404/409/503/network).
**Consequences.** Consistent messages across screens; new screens cannot forget an error case.

## ADR-08 Labelled demo fallback during integration

**Context.** The frontend was built before Group 8 services were reachable through the gateway.
**Decision.** When a Group 8 route is unreachable, clients use synthetic in-memory data and every
page shows a "synthetic demo data" notice. `VITE_G8_DEMO_MODE=false` disables it. Real backend
errors are never replaced.
**Consequences.** UI could be reviewed and tested early; deployed builds must turn demo mode off so
outages are visible.

## ADR-09 Group 8 routes merged into the shared navigation

**Decision.** Group 8 routes and role rules live in `src/config/group8Routes.ts` and are spread into
the shared `APP_ROUTES_CONFIG`, so the Group 5 sidebar and `ProtectedRoute` apply them.
**Consequences.** One product navigation; Group 8 changes rarely conflict with other groups' files.
