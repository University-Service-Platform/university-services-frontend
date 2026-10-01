# User Flow 01: Resource Manager Lifecycle Flow
**Role:** `FACILITY_MANAGER` / `ADMIN`  
**Primary Goal:** Inspect, maintain, update, and configure campus resource availability and policies.

---

## 1. Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Manager as Facility Manager
    participant App as Frontend (React App)
    participant Modal as Resource Form / Detail Modal
    participant API as Resource Service API

    Manager->>App: Navigates to /resources
    App->>API: GET /api/v1/resources
    API-->>App: Return resources list
    App-->>Manager: Displays interactive resource grid with filters
    
    Manager->>App: Clicks "View Details" on specific resource
    App-->>Modal: Opens ResourceDetailModal (specs, policies, capacity)
    
    Manager->>Modal: Clicks "Edit Resource"
    Modal-->>App: Transitions to ResourceFormModal with pre-populated data
    
    Manager->>App: Modifies capacity to 50 & enables "Requires Approval"
    Manager->>App: Clicks "Save Resource"
    App->>App: Performs client-side field validation
    App->>API: PUT /api/v1/resources/:id (updated payload)
    API-->>App: HTTP 200 OK (updated resource object)
    App-->>Manager: Displays Success Toast ("Resource Updated")
    App->>API: Refreshes resources cache
    App-->>Manager: Renders updated resource card with new policies
```

---

## 2. Step-by-Step Experience Breakdown

1. **Discovery & Exploration:**
   - Manager navigates to `/resources`.
   - Uses the facility filter to isolate resources under their management jurisdiction (e.g., "Faculty of Science").
2. **Detail Review:**
   - Clicks on a resource card to view current utilization, amenity breakdown, and approval requirements.
3. **Configuration & Update:**
   - Clicks "Edit" to adjust capacity or toggle maintenance status.
   - Form validates all fields in real-time.
4. **Instant Synchronization:**
   - Submitting triggers API update; toast notification confirms success.
   - Resource status reflects immediately across the Calendar and Availability search modules.
