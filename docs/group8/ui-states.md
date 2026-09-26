# Group 8 UI state matrix

Jira: USMG8-48 (S1-05.4). Every Group 8 screen handles the states below. Error kinds come from
the shared mapping in `src/services/group8/g8Api.ts` (400 validation, 401 session, 403 forbidden,
404 not found, 409 conflict, 503 dependency unavailable, 0 network).

## Common behaviour

| State | How it is shown |
|---|---|
| Loading | Shared `LoadingState` with a screen-specific title; buttons show a spinner and are disabled while submitting |
| Empty | Shared `EmptyState` with a reason and, where useful, a next action (e.g. "Browse events") |
| Success | Green `G8Alert` status message; lists update in place |
| Validation error (400) | Field-level messages next to inputs plus a summary alert (moving focus to the first invalid field: pending USMG8-71) |
| Session expired (401) | "Your session has expired" dialog with **Sign in again** (USMG8-191) |
| Forbidden (403) | Route: shared `UnauthorizedPage`. Action: the backend's reason (e.g. "not eligible for this event") in a red alert |
| Not found (404) | `ErrorState` "Event unavailable" / "Could not open feedback form" with a back link |
| Conflict (409) | Backend reason in an alert (capacity reached, registration closed, already registered, already submitted); data is refreshed |
| Dependency unavailable (503) | Amber alert saying which university service is unavailable and that nothing was saved |
| Network / gateway unreachable | Demo data with a visible "synthetic demo data" notice (dev), or `ErrorState` with **Try Again** when demo mode is off |

## Per screen

| Screen | Loading | Empty | Business states shown |
|---|---|---|---|
| Events list | "Loading events..." | "No events found" (filter-aware wording) | Registration open/closed pill, "Capacity reached", "Registration closed on ..." |
| Event detail | "Loading event..." | - | Draft / published / cancelled / completed; registration opens-on / closed-on / capacity-reached reason; already registered with status |
| Event form | "Loading event..." (edit) | - | Venue valid / invalid with reason / Group 6 unavailable; capacity over venue limit; cannot edit cancelled/completed |
| Organizer tools | "Loading registrations..." | "No registrations yet" (draft vs published wording) | Publish blocked by venue validation; cancel requires a reason |
| My Registrations | "Loading your registrations..." | Per tab, with "Browse events" | Cancellation deadline passed; event cancelled by organizer; completed |
| Announcements | "Loading announcements..." | "No announcements" | Draft vs published (manage view) |
| New announcement | - | - | Directory unavailable -> type IDs; recipient estimate (publish confirmation: pending USMG8-157) |
| Notifications | "Loading notifications..." | "You're all caught up" / "No notifications yet" | Unread highlight and count; optimistic read with rollback |
| Feedback center | "Loading your activities..." | "Nothing to review yet" | Ready / not yet available (with Group 7 status reason) / submitted |
| Feedback form | "Checking eligibility..." | - | Not completed, rejected, already submitted, Group 7 unavailable |
| Feedback summary | "Loading feedback summaries..." | "No feedback yet" | - |
| Engagement dashboard | "Loading engagement data..." | Dashboard error state (per-section empty states: pending USMG8-196) | - |
