# Calendar Event Visuals, Tooltips & State Designs
**Document Ref:** `UIUX-EV-03-EVENT-STATES`

---

## 1. Event Pill / Block Visual Styling

Event pills inside calendar cells follow strict semantic color mappings:

| Status | Background | Border (Left 4px) | Text Color | Icon |
|---|---|---|---|---|
| **CONFIRMED** | `#F0FDF4` | `#15803D` | `#14532D` | `CheckCircle2` |
| **PENDING_APPROVAL** | `#FFFBEB` | `#F59E0B` | `#78350F` | `Clock` |
| **COMPLETED** | `#F1F5F9` | `#94A3B8` | `#475569` | `Check` |
| **CANCELLED** | `#FEF2F2` | `#EF4444` | `#991B1B` | `XCircle` |

### Interaction Details:
- **Hover State:** Pill lifts slightly (`transform: scale(1.02)`), shadow increases, and cursor changes to pointer.
- **Click Action:** Triggers `ReservationDetailModal` to show complete booking metadata (organizer, contact, equipment, approved by).

---

## 2. Empty, Loading, and Error States

### 2.1 Loading Calendar State
- Smooth pulsing grid overlay (`Calendar` spinner icon) with text: "Loading reservation timetable...".
- Prevents flickering when user toggles between months.

### 2.2 Empty Calendar Schedule
- When no events exist in the active month/week:
- Subtle centered placeholder: "No reservations scheduled for this time period."
- Clean "+ Reserve a Slot" shortcut button.

### 2.3 Mobile Layout Adaptations
- On screens `<=640px`:
  - 7-column grid switches to an interactive horizontal day-strip carousel.
  - Selecting a day renders a chronological list of reservation cards for that specific day.
