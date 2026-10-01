# Resource Create & Edit Form Specification
**Document Ref:** `UIUX-EV-02-RESOURCE-FORM`  
**Component:** `ResourceFormModal.tsx`

---

## 1. Form Schema & Field Specifications

```text
+------------------------------------------------------------------------+
| Modal Title: [ Add New Resource / Edit Resource ]                  [X] |
+------------------------------------------------------------------------+
| Resource Name *                                                        |
| [ e.g., High-Performance Computing Cluster Lab                      ]  |
|                                                                        |
| Facility / Location *                     Resource Type *              |
| [ Faculty of Computing (FOC)        v ]   [ Laboratory             v ] |
|                                                                        |
| Capacity / Quantity *                     Location / Room Number *     |
| [ 45                                  ]   [ Level 3, Room 302        ] |
|                                                                        |
| Initial Status *                          Approval Requirement *       |
| [ Available                         v ]   [X] Require Manager Approval |
|                                                                        |
| Description & Amenities                                                |
| [ Equipped with 45 GPU workstations, dual 4K monitors, gigabit LAN   ] |
|                                                                        |
+------------------------------------------------------------------------+
| [ Cancel ]                                         [ Save Resource ]   |
+------------------------------------------------------------------------+
```

---

## 2. Field Specifications

1. **Resource Name (`name`)**:
   - Element: Single-line text input.
   - Validation: Required, trimmed string, 3 to 80 characters.
   - Feedback: "Please enter a descriptive resource name."
2. **Facility (`facilityId`)**:
   - Element: Single-select dropdown populated with all active facilities.
   - Validation: Must select an active facility.
3. **Resource Type (`type`)**:
   - Element: Dropdown options (`ROOM`, `LAB`, `EQUIPMENT`, `SPORTS`, `OTHER`).
4. **Capacity (`capacity`)**:
   - Element: Positive integer number input.
   - Validation: Integer between 1 and 2,000.
5. **Location / Room (`location`)**:
   - Element: Text input for physical directions.
6. **Requires Approval (`requiresApproval`)**:
   - Element: Checkbox / Toggle switch with clear explanatory text: "Reservations for this resource require approval from a Facility Manager."
7. **Status (`status`)**:
   - Element: Dropdown (`AVAILABLE`, `MAINTENANCE`, `INACTIVE`).
8. **Description (`description`)**:
   - Element: Multiline textarea, max 500 characters.
