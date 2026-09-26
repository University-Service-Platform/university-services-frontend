# Group 8 Frontend - Events, Communications & Feedback

Group 8 feature module for the shared University Services Management Platform frontend
(React + TypeScript + Redux Toolkit). It follows the shared foundation from Group 5
(`AppShell`, `ProtectedRoute`, UI kit, `apiFetch`) and adds Group 8 screens under the
routes listed in the Group 8 BA Requirements Report (section 8).

## Routes

| Route | Screen | Access | Requirement |
|---|---|---|---|
| `/events` | Event list, search & status filters | Signed-in users | US8-01, FR8-04 |
| `/events/new` | Create event (saved as draft) | ADMIN, STAFF, HOD, DEAN | US8-01, BR8-01 |
| `/events/:eventId` | Event detail, register, organizer tools (publish / cancel / registration summary) | Signed-in users (tools: organizers) | US8-03, US8-04, US8-07 |
| `/events/:eventId/edit` | Edit event, Group 6 venue check | ADMIN, STAFF, HOD, DEAN | US8-02, FR8-17 |
| `/registrations` | My Registrations, cancel before deadline | Signed-in users | US8-05, US8-06 |
| `/announcements` | Targeted announcement feed; staff management view | Signed-in users | US8-09 |
| `/announcements/new` | Compose announcement with audience targeting | ADMIN, STAFF | US8-08, BR8-06 |
| `/notifications` | Notification Center (plus header bell) | Signed-in users | US8-10 |
| `/feedback` | Activities ready for / pending feedback | Signed-in users | US8-12 |
| `/feedback/:activityType/:activityId` | Feedback form | Eligible users | US8-12, BR8-07 |
| `/feedback/summary` | Feedback summary | ADMIN, STAFF, HOD, DEAN | US8-13 |
| `/engagement-dashboard` | Engagement dashboard | ADMIN, STAFF, HOD, DEAN | Feature 8 |

Route/role configuration lives in `src/config/group8Routes.ts` and is merged into the shared
`APP_ROUTES_CONFIG`, so the sidebar and `ProtectedRoute` apply the same rules. Role checks in
the UI are for navigation only - every protected operation is authorized by the Group 8
services (BR8-09).

## Folder layout

```
src/
  config/group8Routes.ts          route ownership + role groups
  routes/group8RouteElements.tsx  route path -> page element
  pages/group8/                   Group 8 screens
  components/group8/              shared Group 8 UI pieces (page shell, badges, bars, bell)
  services/group8/                API clients (gateway paths, typed results, demo fallback)
  store/                          Redux store (activity signal, notification inbox)
  types/group8.ts                 domain types
```

## API contract (via API Gateway, base `VITE_API_BASE_URL`, default `/api/v1`)

### event-service

| Method | Path | Purpose |
|---|---|---|
| GET | `/events?status=&search=&scope=` | Events visible to the caller |
| GET | `/events/{id}` | Event detail |
| POST | `/events` | Create (DRAFT) |
| PUT | `/events/{id}` | Update |
| POST | `/events/{id}/publish` | Publish (venue re-validated with Group 6) |
| POST | `/events/{id}/cancel` | Cancel `{ reason }`, registrants notified (BR8-04) |
| GET | `/events/venues/{resourceId}/validation` | Group 6 venue check proxied by event-service |
| POST | `/events/{id}/registrations` | Register caller (status, window, Group 5 eligibility, capacity) |
| GET | `/events/{id}/registrations/summary` | Organizer registration/capacity summary |
| GET | `/registrations/me` | Caller's registrations |
| POST | `/registrations/{id}/cancel` | Cancel own registration |

### communication-feedback-service

| Method | Path | Purpose |
|---|---|---|
| GET | `/announcements` | Announcements targeted at the caller (filtered server-side) |
| GET | `/announcements/managed` | Announcements the caller may manage |
| POST | `/announcements` | Create `{ title, content, audience, publishNow }` |
| POST | `/announcements/{id}/publish` | Publish draft |
| POST | `/announcements/audience-preview` | Estimated recipients for an audience rule |
| GET | `/notifications/me` | Caller's notifications |
| PATCH | `/notifications/{id}/read` | Mark read |
| PATCH | `/notifications/me/read-all` | Mark all read |
| POST | `/notifications` | **Provided to Groups 6/7** - trigger `{ recipientId, type, title, message, source, referenceId }` |
| GET | `/feedback/activities/me` | Caller's activities with eligibility |
| GET | `/feedback/forms?activityType=&activityId=` | Form for an eligible activity |
| POST | `/feedback/responses` | Submit feedback (one per user & activity) |
| GET | `/feedback/summaries?activityType=` | Aggregated results (staff) |
| GET | `/engagement/summary` | Engagement dashboard data (staff) |

Service-request feedback eligibility uses the Group 7 completion-status contract
(`GET /api/work-orders/by-request/{requestId}`): `RESOLVED`/`CLOSED` are eligible,
`REJECTED` is explained as not eligible, any other status reads as "not yet eligible".

### Error handling

All Group 8 clients return a typed `G8Result` and map HTTP status to a user-facing state:
400 validation, 401 session expired, 403 forbidden, 404 not found, 409 conflict
(capacity reached, duplicate, closed window), 503 dependent service unavailable (no local
change is assumed). The backend's own message is shown when it provides one.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | API Gateway base path (shared) |
| `VITE_G8_DEMO_MODE` | enabled | Set to `false` to disable the synthetic fallback |

**Demo fallback:** when a Group 8 gateway route is unreachable (network error, route not
registered, 502/504, or an SPA fallback page), the clients use synthetic in-memory data so the
UI can be reviewed before the services are deployed. Pages then show a visible "synthetic
demo data" notice. Real backend responses (400/401/403/409/503...) are never replaced.
Only synthetic data is used (BR8-12).

## Shared state (Redux)

- `activity` - a revision counter bumped after register / cancel / publish / feedback; the
  notification bell refetches when it changes (S3-04.4).
- `notifications` - the inbox shared by the header bell and the Notification Center, with
  optimistic read-state updates and 60 s polling for notifications triggered by Groups 6/7.

Page-local form state stays in component state.

## Known dependencies on other groups

- Group 5: login currently keeps the user in memory only and `apiFetch` does not yet attach
  a bearer token - protected Group 8 calls need the shared client to send the JWT once the
  identity contract is final.
- Group 5 directory: announcement targeting uses `getFaculties` / `getServiceUnits` when
  available and falls back to typed IDs; no departments endpoint exists yet.
- Group 6: venue validation is proxied through event-service.
- Group 7: completion status for service-request feedback, see above.
