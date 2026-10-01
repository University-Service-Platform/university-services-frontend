# User Flow 02: End-User Calendar Schedule & Booking Flow
**Role:** `STUDENT` / `LECTURER` / `STAFF`  
**Primary Goal:** Check campus room schedules and reserve an available time block.

---

## 1. Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Campus User (Lecturer/Student)
    participant Cal as Calendar Page (/calendars)
    participant Modal as Reservation Form Modal
    participant API as Reservation Service

    User->>Cal: Opens /calendars
    Cal-->>User: Displays Month View with all confirmed university bookings
    
    User->>Cal: Filters by Facility: "Faculty of Computing" & Resource: "AI Lab"
    Cal-->>User: Re-renders calendar highlighting booked vs free periods
    
    User->>Cal: Identifies open slot on Wednesday 14:00 - 16:00
    User->>Cal: Clicks "Book This Slot" / "+ New Reservation"
    Cal-->>Modal: Launches ReservationFormModal with Date & Resource pre-selected
    
    User->>Modal: Enters purpose ("CS401 Final Project Review"), attendees (20)
    User->>Modal: Clicks "Submit Reservation Request"
    Modal->>API: POST /api/v1/reservations
    API-->>Modal: HTTP 201 Created (Status: PENDING_APPROVAL)
    Modal-->>User: Shows Toast: "Reservation request submitted for review"
    Cal-->>User: Adds amber "Pending" event chip onto selected time block
```

---

## 2. Key UX Safeguards
- **Conflict Prevention:** System validates against existing confirmed reservations before submission, immediately notifying the user if a selected time block conflicts.
- **Pre-populated Context:** Clicking directly on a calendar date automatically prefills the date and time in the reservation modal, minimizing repetitive typing.
