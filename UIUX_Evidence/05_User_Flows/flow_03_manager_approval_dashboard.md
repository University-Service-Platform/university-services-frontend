# User Flow 03: Manager Dashboard & Approval Processing Flow
**Role:** `FACILITY_MANAGER` / `ADMIN`  
**Primary Goal:** Monitor university operations, review incoming requests, and approve/reject bookings.

---

## 1. Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Manager as Facility Manager
    actor Requester as Lecturer / Student
    participant Dash as Dashboard (/dashboard)
    participant Approvals as Approval Queue (/approvals)
    participant API as Reservation Service

    Requester->>API: Submits reservation requiring approval
    API->>API: Flag reservation status as PENDING_APPROVAL
    
    Manager->>Dash: Logs in / Navigates to Dashboard
    Dash-->>Manager: Pending Approvals KPI card displays "4 Action Required" in amber
    
    Manager->>Dash: Clicks "Review Approvals" on KPI card or sidebar
    Dash->>Approvals: Navigates to /approvals
    Approvals-->>Manager: Renders pending requests table with applicant name & purpose
    
    Manager->>Approvals: Clicks "Approve" on reservation #RES-2026-089
    Approvals-->>Manager: Prompts for optional confirmation note
    Manager->>Approvals: Confirms approval
    Approvals->>API: PATCH /api/v1/reservations/RES-2026-089/approve
    API-->>Approvals: HTTP 200 OK (Status: CONFIRMED)
    Approvals-->>Manager: Displays success toast; item slides out of queue
    Approvals-->>Requester: Notification dispatched; booking status now Confirmed
```

---

## 2. Rejection Flow with Reason Validation
If a conflict or scheduling restriction exists:
1. Manager clicks `Reject`.
2. A mandatory dialog pops up requiring a `Rejection Reason` (minimum 10 characters).
3. The reason is saved and communicated back to the user to ensure transparency.
