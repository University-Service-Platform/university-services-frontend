# Resource List Screen Specification (USMG6-116)
**Document Ref:** `UIUX-EV-02-RESOURCE-LIST`  
**Route:** `/resources`  
**Target User Roles:** All authenticated users (`STUDENT`, `STAFF`, `LECTURER`, `FACILITY_MANAGER`, `ADMIN`)

---

## 1. Visual Layout Hierarchy

```text
+---------------------------------------------------------------------------------------------+
| Header: "Resource Management"                           [ + Add Resource (Manager only) ]   |
| "Manage and monitor campus equipment, lecture halls, and laboratories"                     |
+---------------------------------------------------------------------------------------------+
| [ Search resources... ] [ All Facilities v ] [ All Types v ] [ All Statuses v ]             |
+---------------------------------------------------------------------------------------------+
|  +---------------------------+ +---------------------------+ +---------------------------+  |
|  | Card 1: AI Computing Lab  | | Card 2: Main Aud. Hall    | | Card 3: 4K Laser Proj.    |  |
|  | Status: [ AVAILABLE ]     | | Status: [ AVAILABLE ]     | | Status: [ MAINTENANCE ]   |  |
|  | Loc: IT Complex, Level 3  | | Loc: Main Campus, Gr.Fl   | | Loc: Engineering Block    |  |
|  | Capacity: 45 Seats        | | Capacity: 350 Seats       | | Qty: 1 Unit               |  |
|  | Approval: Required        | | Approval: Required        | | Approval: None            |  |
|  | [View Details] [Book Now] | | [View Details] [Book Now] | | [View Details] [Out Svc]  |  |
|  +---------------------------+ +---------------------------+ +---------------------------+  |
+---------------------------------------------------------------------------------------------+
```

---

## 2. Component Design Details

### 2.1 Search & Filter Toolbar
- **Search Bar:** Full-width debounced text filter querying `name`, `code`, and `description`.
- **Facility Dropdown:** Populates list of active facilities dynamically.
- **Resource Type Filter:** Segmented filter supporting `ROOM`, `LAB`, `EQUIPMENT`, `SPORTS`, `OTHER`.
- **Status Filter:** Options: `ALL`, `AVAILABLE`, `MAINTENANCE`, `INACTIVE`.

### 2.2 Resource Card Structure
- **Border & Glow:** 1px border `rgba(59, 130, 246, 0.4)` with ambient teal-blue shadow.
- **Header:** Resource Title (`font-weight: 700`, `#0F172A`) with aligned status badge (`Badge` component).
- **Metadata Badges:**
  - `Building2` icon with Facility name.
  - `Users` icon with seat capacity / quantity.
  - `ShieldAlert` / `ShieldCheck` icon highlighting approval rules.
- **Action Buttons:**
  - `View Details`: Transparent outline button opening `ResourceDetailModal`.
  - `Book Now`: Primary teal `#0F766E` button initiating `ReservationFormModal`.
  - `Edit / Delete`: Rendered conditionally only for `FACILITY_MANAGER` and `ADMIN`.
