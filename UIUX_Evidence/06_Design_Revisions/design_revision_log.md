# Design Revision & Usability Improvement Log
**Document Ref:** `UIUX-EV-06-REVISION-LOG`  
**Lead UI/UX Designer:** Member 2  
**Evaluation Scope:** Sprint 3 & Sprint 4 Design Iterations

---

## 1. Summary of Iterations

During the transition from initial wireframe prototypes to production implementation, multiple UI/UX reviews and usability refinements were made to ensure higher density, intuitive navigation, and accessibility.

---

## 2. Comprehensive Design Revision Matrix

| ID | Module / Area | Initial Prototype Design | Final Implemented Design | Usability Rationale & Impact |
|---|---|---|---|---|
| **REV-01** | **Global UI & Badges** | Ticket numbers and Jira IDs (e.g. `[USMG6-122]`) were visible directly on user-facing titles and headers. | Removed all developer ticket tags from user-facing views; retained clean domain titles ("Facility Management", "Resource Catalog"). | Significantly improved professional credibility and eliminated developer jargon from student/lecturer views. |
| **REV-02** | **Form Modals Layout** | Single-column, tall vertical form layouts that caused vertical overflow and required excessive scrolling on laptops (1366x768). | Compact 2-column grid inside form modals (`grid-2`), tighter padding, and concise helper text. | Complete forms now comfortably fit on 100% of standard desktop and laptop screens without modal body scroll. |
| **REV-03** | **Card Surfaces & Elevation** | Flat white cards with standard 1px grey borders; lacked visual hierarchy against slate background. | Interactive cards featuring persistent subtle dual-glow blue/teal borders (`rgba(59, 130, 246, 0.35)`) and smooth `-3px` elevation on hover. | Greatly enhances modern aesthetic, guides eye to interactive boundaries, and fulfills rich design guidelines. |
| **REV-04** | **Sidebar Navigation** | Included a persistent "Sprint 3 / Sprint 4 Info Box" occupying 140px of sidebar real estate. | Replaced with clean role-aware navigation links and a compact user profile / role switcher drawer. | Increases focus on campus operational tools and allows effortless persona testing (`Admin`, `Manager`, `Student`). |
| **REV-05** | **Calendar Filtering** | Independent dropdown filters that could produce empty cross-facility combinations. | Cascading filter where selecting a facility automatically scopes the resource filter to that facility. | Eliminates user error and impossible filter states. |
| **REV-06** | **Approval Queue Feedback** | Instant rejection with a generic confirmation alert. | Mandatory structured Rejection Modal requiring a written justification (min 10 characters). | Ensures campus accountability and informs students why their reservation request could not be accommodated. |
| **REV-07** | **Image Fallback Resilience** | Static external image links with no error handlers. | Automatic SVG fallback placeholder with campus icons whenever facility image fails to load. | Guarantees zero broken image icons or disrupted layouts even in offline or slow network conditions. |
| **REV-08** | **Mobile Bottom Navigation** | Fixed top bar only, requiring two-handed navigation on smartphones. | Collapsible responsive sidebar with mobile hamburger menu and quick action floating triggers. | Enables effortless one-handed thumb navigation on mobile devices. |
