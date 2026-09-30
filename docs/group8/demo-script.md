# Group 8 demo script (release candidate)

Jira: USMG8-170 (S3-07.6), USMG8-214 (S4-06.4). Target length: **8 minutes**.
Covers the two required cross-team workflows: event + venue + registration + notification, and
service completion + feedback.

## Before the demo (10 minutes earlier)

| Check | How |
|---|---|
| Accounts | One **staff** account (organizer + announcer) and one **student** account from Group 5 synthetic users (e.g. `STU001`). Two browser windows: normal + private. |
| Mode | Integrated stack: `VITE_G8_DEMO_MODE=false`, no "synthetic demo data" banner. Fallback only: demo mode on, and say so. |
| Data | Group 6 has an active venue (e.g. `RES-204` / `LAB-101`); Group 7 has one request `RESOLVED` for the student. |
| Screen | Browser zoom 110-125 % for the projector; close other tabs. |

## Flow A - event, venue, registration, notification (5 min)

| Time | Who | Screen | Do | Say / point out |
|---|---|---|---|---|
| 0:00 | Staff | Events | Click **Create Event** | Organizer-only button - students never see it (role-aware navigation). |
| 0:30 | Staff | Create Event | Fill title, schedule, capacity **2**, eligibility **Student**; venue `RES-555` -> **Check venue** | Group 6 rejects an inactive venue with its reason. |
| 1:15 | Staff | Create Event | Change venue to `RES-204` -> **Check venue** -> **Save as draft** | Venue valid with capacity; draft saved. |
| 1:45 | Staff | Event page | **Publish** | Venue re-validated at publish; event now visible to eligible users. |
| 2:15 | Student | Events -> event | **Register for this event** | Group 5 eligibility check; "Registration confirmed". |
| 2:45 | Student | Header bell | Bell count goes up -> open Notifications | Notification created by Group 8 after registration. |
| 3:15 | Staff | Event page | Organizer tools summary shows 1 confirmed / 1 place left | Registration/capacity summary. |
| 3:45 | Staff | Announcements -> New | Audience **By role: Student**, **Publish now** -> confirm | Recipient estimate and confirmation; only targeted users see it. |
| 4:30 | Student | Announcements / bell | Announcement visible, notification received | Targeted visibility (BR8-06). |

**Optional (30 s):** a second student tries to register when capacity is full -> "Capacity reached -
registration is closed".

## Flow B - service completion to feedback (2.5 min)

| Time | Who | Screen | Do | Say / point out |
|---|---|---|---|---|
| 5:00 | Student | Notifications | Filter **Source: Service Desk** | Notification pushed by Group 7 through Group 8's trigger API. |
| 5:30 | Student | Feedback | Request shows under "Ready for your feedback"; an in-progress one is under "Not yet available" with its reason | Eligibility from Group 7 status (RESOLVED/CLOSED only). |
| 6:15 | Student | Feedback form | Rate, answer, **Submit** | Progress indicator; one response per activity. |
| 7:00 | Staff | Engagement | Dashboard + Feedback summary | Participation, reach and ratings for staff only. |

## Wrap-up (30 s)

"Group 8 consumes Group 5 identity and eligibility, Group 6 venue validation and Group 7 completion
status, and provides the notification API that Groups 6 and 7 call - all through the API Gateway."

## If something fails live

| Problem | Recovery |
|---|---|
| Group 5/6/7 service down | Show the 503 message ("nothing saved") - it is a designed state; move on. |
| Login fails | Switch to the second window, which is already signed in. |
| Session expired dialog | Click **Sign in again** - it is part of the design (USMG8-191). |
| Gateway down | Switch to the local fallback build with demo mode on and state it clearly. |

## Screens are demo-ready (USMG8-214)

Every step above is reachable in at most two clicks from the sidebar (Events, My Registrations,
Announcements, Notifications, Feedback, Engagement); no step needs typing a URL, and no screen in
the path is a dead end (each has a back link or sidebar entry).
