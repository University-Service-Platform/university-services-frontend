# Group 8 user journey maps

Jira: USMG8-45 (S1-05.1). Actors from the Group 8 BA report (section 2); flows from sections 7
and 13. Screens refer to the implemented routes.

## 1. Student - discover, register, attend, give feedback

| Stage | Goal | Screen / action | System decision | What the student sees if it fails |
|---|---|---|---|---|
| Discover | Find relevant events | `/events` - search, filter "Upcoming" | Only events eligible for the student's role are listed (US8-01 AC) | "No events found" with filter hint |
| Evaluate | Decide whether to attend | `/events/:id` - schedule, venue/online, eligibility, capacity meter | Registration availability pre-check | "Registration opens on ..." / "Registration closed on ..." / "Capacity reached - registration is closed" |
| Register | Secure a place | **Register for this event** | event-service: published? window open? Group 5 eligible? capacity? duplicate? | Backend reason (e.g. not eligible for department); "Identity service unavailable - nothing saved" |
| Confirm | Know it worked | Success alert; status badge "Confirmed"; bell count +1 | Notification "Registration confirmed" | - |
| Change plans | Release the place | `/registrations` - **Cancel registration** (confirm dialog) | Before registration close date? | "The cancellation deadline has passed" |
| Stay informed | Hear about changes | Header bell, `/notifications` | Event cancelled -> notification with organizer's reason | - |
| Reflect | Share experience | `/feedback` - "Ready for your feedback" -> form | Event COMPLETED and student was registered; one response only | "Feedback opens after the event has taken place" / "already submitted" |

**Pain points addressed:** a disabled button alone never explains why - every closed state has a
sentence; capacity is visible before clicking.

## 2. Event Organizer (academic/administrative staff) - create, publish, manage

| Stage | Goal | Screen / action | System decision | Failure feedback |
|---|---|---|---|---|
| Plan | Draft the event | `/events/new` - details, schedule, capacity, eligibility | Client validation, then server validation (BR8-01, DV8-01) | Field messages and error summary |
| Choose venue | Use a real room | **Check venue** (Group 6) | Active and available; capacity within venue limit | "Venue cannot be used: under maintenance"; "Facility Services unavailable - save a draft" |
| Save | Keep a draft | **Save as draft** | Organizer role (BR8-09) | Forbidden reason |
| Publish | Open registration | Event page -> **Publish** | Draft only; venue re-validated | "Venue validation failed: ..." |
| Monitor | Track attendance | Organizer tools: confirmed / places left / waitlisted / cancelled, registrant table | Organizer only | "Summary unavailable" + retry |
| Adjust | Change details | **Edit event** | Capacity cannot go below confirmed count | Conflict reason |
| Cancel | Call off the event | **Cancel event** + reason (>= 10 chars) | All registrations cancelled, registrants notified (BR8-04) | Reason required |
| Review | Learn from feedback | `/feedback/summary` | Insight roles only | Unauthorized page |

## 3. Authorized Staff (announcements, summaries) - inform the right audience

| Stage | Goal | Screen / action | System decision | Failure feedback |
|---|---|---|---|---|
| Compose | Write the message | `/announcements/new` - title, content | Title and content required | Field messages |
| Target | Reach only the right people | Audience: all / role / faculty / department / service unit | Non-empty audience rule (DV8-04); Group 5 directory lists when available | "Select at least one recipient group"; directory down -> enter IDs |
| Check reach | Avoid over-notifying | Live recipient estimate | Audience preview from directory data | Preview error text |
| Publish | Send it | **Publish now** (or save draft) | Staff role; audience valid; notifications only to the audience (BR8-06, BR8-08) | Forbidden / validation reason |
| Manage | Publish drafts later | Announcements -> "Manage announcements" | Draft only | Conflict reason |
| Measure | See engagement | `/engagement-dashboard` - participation, reach, ratings | Insight roles only | Unauthorized page |

## Cross-team touchpoints in these journeys

- Group 5: login/JWT, role-aware navigation, registration eligibility, announcement targeting.
- Group 6: venue check and publish-time venue validation.
- Group 7: service-request feedback eligibility; service-request status notifications in the inbox.
