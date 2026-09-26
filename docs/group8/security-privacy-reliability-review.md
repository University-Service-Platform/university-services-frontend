# Group 8 review: authorization, privacy, failure handling and data ownership

Jira: USMG8-158 (S3-05.6), USMG8-190 (S4-02.4). Reviewer: Group 8 Team Lead. Date: 27 Sep 2026.
Scope: Group 8 frontend (`feature/group8-frontend`), Group 8 contracts
([api-contract-register.md](api-contract-register.md)) and consumed contracts.
Severity: **High** = must fix before release, **Medium** = fix or accept explicitly, **Low** = note.

## 1. Findings

| # | Severity | Area | Finding | Owner / action |
|---|---|---|---|---|
| F1 | **High** | Authentication | The shared `apiFetch` sends no `Authorization: Bearer` header and the login response token is not stored, so protected Group 8 endpoints will return 401 in the integrated environment. | Group 5 shared frontend: store the JWT from `/auth/login` and attach it in `apiFetch`. Group 8 already handles 401 with the session-expired dialog. |
| F2 | Medium | Authentication | Auth state is in memory only; a page refresh signs the user out and breaks deep links (USMG8-160). | Group 5: persist the session (sessionStorage) and restore on load. |
| F3 | Medium | Authorization / privacy | Registration summary returns registrant names and departments. Any organizer-role user could request another organizer's event summary unless the backend checks ownership. | event-service (harshana): allow only the event's organizer and ADMIN. |
| F4 | Medium | Privacy | Online meeting links must not be sent to users who are not registered; the UI hides the link, but that is not protection. | event-service: omit `onlineLink` from event detail unless the caller has a confirmed registration or is the organizer. |
| F5 | Medium | Integrity | Notification trigger (`POST /notifications`) trusts `source`; a caller could post as another group. | communication-feedback-service (Kasun): derive `source` from the caller's service identity, reject mismatches with 403. |
| F6 | Medium | Reliability | Demo fallback could hide a real outage if left on in a deployed build. | Deploy with `VITE_G8_DEMO_MODE=false` (in the deployment checklist); pages already show a visible notice when it is on. |
| F7 | Low | Privacy | Feedback free-text comments may contain personal data; summaries show recent comments to staff. | Summaries never show respondent identity (already true); add a hint on the form not to include personal details. |
| F8 | Low | Shared code | `apiClient.ts` checks `status === 24` for empty responses; it should be `204`. Group 8 is not affected (bodiless 2xx handled in `g8Api.ts`). | Group 5: correct the constant. |
| F9 | Low | Privacy | Audience preview returns only counts, never recipient lists. | No action - keep it that way. |

## 2. Authorization matrix (enforced server-side; UI mirrors it for navigation)

| Operation | Student | Staff | HOD / Dean | Admin | Extra condition |
|---|---|---|---|---|---|
| View events / register / cancel own | Yes | Yes | Yes | Yes | Eligibility rule (Group 5) |
| Create / edit / publish / cancel event | - | Yes | Yes | Yes | Edit/cancel: own events (Admin: any) |
| Registration summary | - | Own events | Own events | Any | F3 |
| View announcements | Targeted only | Targeted only | Targeted only | Targeted only | Server-side filter (BR8-06) |
| Create / publish announcement | - | Yes | - | Yes | Non-empty audience |
| Notifications | Own only | Own only | Own only | Own only | |
| Submit feedback | Own completed activities | same | same | same | Group 7 status for requests |
| Feedback summary / engagement dashboard | - | Yes | Yes | Yes | No respondent identities |

## 3. Cross-service failure handling

| Dependency down | Affected action | Behaviour (implemented / required) |
|---|---|---|
| Group 5 (identity/eligibility) | Registration, announcement targeting | Registration **not** confirmed, 503, message "nothing saved" (ADR-04). Eligibility is never assumed. |
| Group 5 directory lists | Announcement composer | Falls back to typing directory IDs; preview may be unavailable. |
| Group 6 (venue validation) | Venue check, publish | Event stays DRAFT; 503 message suggests saving a draft and validating later. |
| Group 7 (completion status) | Service feedback form | Form not opened; "could not confirm with the Service Desk" message. Event feedback unaffected. |
| communication-feedback-service | Notifications after registration/cancel | Registration still succeeds; notification delivery retried by event-service (must not roll back the registration). |
| API Gateway unreachable | All Group 8 screens | Error state with **Try Again** (or labelled demo data in development). |

Frontend behaviour for each case: [ui-states.md](ui-states.md).

## 4. Data ownership compliance

- Group 8 stores only Group 5 `user_id`s, Group 6 resource IDs and Group 7 request IDs - never
  copies of other groups' records beyond display text needed in notifications.
- No Group 8 code reads another group's database; all cross-group data comes through the published
  endpoints in [consumed-contracts.md](consumed-contracts.md).
- Other groups reach Group 8 data only through the endpoints in the contract register; the only one
  intended for other groups is `POST /notifications`.
- The frontend never filters security-relevant data client-side (announcement visibility, event
  eligibility) - it shows what the services return.
- Only synthetic data is used (BR8-12); demo data uses invented names and IDs.

## 5. Result

No Group 8 frontend change is required for release beyond items already done. **F1 is release-
blocking** for the integrated environment and belongs to the shared Group 5 foundation. F3-F5 are
backend items for event-service and communication-feedback-service; F2, F6-F8 are tracked above.
