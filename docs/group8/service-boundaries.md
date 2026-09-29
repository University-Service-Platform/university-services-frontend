# Group 8 service boundaries

Jira: USMG8-29 (S1-03.1). Sources: Group 8 BA Requirements Report (sections 1, 9, 17.3),
Group 8 Development Guide (Team Lead step 1).

Group 8 owns two microservices. Each owns its own database/schema; no other service (inside or
outside Group 8) reads or writes those tables directly (BR8-10, C8-02).

## event-service

**Owns:** `Event`, `EventEligibility` (eligibility rule), `Registration`.

| Responsibility | Business rules |
|---|---|
| Create, edit, publish, cancel events (schedule, physical venue or online link, capacity, registration window, eligibility rule) | BR8-01, DV8-01, DV8-06 |
| Register / cancel registration; enforce status, window, capacity, duplicate prevention | BR8-02, BR8-03, DV8-02, DV8-03 |
| Cancel all active registrations when an event is cancelled | BR8-04 |
| Check registrant eligibility with Group 5 before confirming | BR8-05, FR8-16 |
| Validate physical venues with Group 6 before publishing | FR8-17 |
| Registration/capacity summaries for organizers | FR8-08 |

**Does not own:** notifications (it asks communication-feedback-service to send them), users,
roles, departments (Group 5), venues (Group 6).

## communication-feedback-service

**Owns:** `Announcement`, `AudienceRule`, `Notification`, `FeedbackForm`, `FeedbackResponse`.

| Responsibility | Business rules |
|---|---|
| Create and publish announcements with an audience rule (all / role / faculty / department / service unit); return only announcements targeted at the caller | BR8-06, DV8-04 |
| Store and serve in-app notifications; read state | BR8-08 |
| Provide the notification trigger API to event-service and to Groups 6 and 7 | FR8-12, US8-11 |
| Feedback forms and responses; one response per user and activity | BR8-07, DV8-05 |
| Check service-request completion with Group 7 before accepting service feedback | FR8-18 |
| Feedback summaries and engagement data for authorized staff | FR8-15 |

**Does not own:** events or registrations (it receives event IDs and titles from event-service),
service requests (Group 7).

## Interaction between the two services

```
event-service ──(REST: POST /notifications)──▶ communication-feedback-service
      ▲                                                  ▲
      │ event completion status for event feedback       │ POST /notifications
      └──────────── (REST, read-only) ───────────────────┘ from Groups 6 / 7
```

- event-service calls the notification trigger for registration confirmed/cancelled and event
  updated/cancelled - the same public API Groups 6 and 7 use, so there is one notification path.
- communication-feedback-service asks event-service whether an event is COMPLETED and whether the
  caller had a confirmed registration before accepting event feedback.
- Neither service reads the other's database.

## Where the boundary is visible in the frontend

`src/services/group8/eventService.ts` talks only to event-service paths (`/events`,
`/registrations`); `communicationService.ts` and `feedbackService.ts` talk only to
communication-feedback-service paths (`/announcements`, `/notifications`, `/feedback`,
`/engagement`). Both go through the API Gateway.
