# Resource Details Modal Specification
**Document Ref:** `UIUX-EV-02-RESOURCE-DETAIL`  
**Component:** `ResourceDetailModal.tsx`

---

## 1. Information Architecture

The Resource Details Modal provides an in-depth view of a selected resource without leaving the catalog view:

1. **Header Section:**
   - Resource Name (`h2`, `#0F172A`).
   - Resource Identification Code Badge (e.g., `RES-ENG-04`).
   - Modal Close Icon button (`X`).

2. **Metrics Grid (3-column cards):**
   - **Capacity / Quantity:** Clear large numeric callout (e.g., "50 Seats" / "Qty: 1").
   - **Resource Type:** Categorization pill (`LABORATORY`, `LECTURE HALL`, `EQUIPMENT`).
   - **Operating Status:** Live state pill (`AVAILABLE`, `UNDER MAINTENANCE`, `INACTIVE`).

3. **Facility & Location Details:**
   - Parent Facility: Name with building pin icon.
   - Specific Room / Location: Floor level, room number, wing/block.
   - Contact Person / Department in charge.

4. **Booking & Approval Policies:**
   - **Approval Policy Notice:**
     - When `requiresApproval === true`: Amber notice explaining that requests submitted for this resource must be authorized by the facility administrator before confirmation.
     - When `requiresApproval === false`: Green notice indicating that instant confirmation applies.
   - **Operating Hours:** Earliest booking start time and latest booking cut-off time.

5. **Amenities & Equipment Chips:**
   - Visual tags representing installed features: e.g., "Digital Smartboard", "A/C Controlled", "High-Speed WiFi", "Recording Equipment".

6. **Action Buttons:**
   - `Close`: Reverts modal.
   - `Book This Resource`: Direct shortcut opening the reservation modal with pre-selected resource.
   - `Edit Resource`: Visible only to authorized managers.
