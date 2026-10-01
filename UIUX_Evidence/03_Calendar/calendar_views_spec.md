# Calendar Views & Interaction Specification (USMG6-54, USMG6-55, USMG6-120)
**Document Ref:** `UIUX-EV-03-CALENDAR-VIEWS`  
**Component:** `CalendarViewPage.tsx`  
**Route:** `/calendars`

---

## 1. Calendar System Architecture

The Calendar system is designed around a dual-scope temporal navigation model supporting both high-level monthly scheduling and fine-grained weekly time-blocking.

### 1.1 Month View Architecture
```text
+---------------------------------------------------------------------------------------------------+
| [<] Today [>]    September 2026                 [ Month | Week ]     [ All Facilities v ] [ All v]|
+---------------------------------------------------------------------------------------------------+
|  Sun       |  Mon       |  Tue       |  Wed       |  Thu       |  Fri       |  Sat                |
+------------+------------+------------+------------+------------+------------+---------------------+
| 31 (prev)  | 1          | 2          | 3          | 4          | 5          | 6                   |
|            | 09:00 Conf | 14:00 Lab  |            | 10:00 Exam | 15:00 Conf |                     |
+------------+------------+------------+------------+------------+------------+---------------------+
| 7          | 8          | 9          | 10         | 11         | 12         | 13                  |
|            | 11:00 Mtg  |            | 08:30 Semi |            | 13:00 Hack |                     |
+---------------------------------------------------------------------------------------------------+
```

- **Grid Dimensions:** 7 equal-width columns.
- **Cell Height:** Minimum 120px to accommodate multiple event chips comfortably.
- **Date Indicator:** Top-right corner of each cell. Current date highlighted with an indigo badge (`#1E40AF` circle with white text).
- **Out of Month Cells:** Rendered with muted grey background (`#F8FAFC`) and slate date text (`#94A3B8`).

---

### 1.2 Week View Architecture
- **Time Slots:** 1-hour rows running from 08:00 to 20:00 (Campus operational hours).
- **Day Columns:** 7 columns (Monday to Sunday).
- **Time Indicators:** Left-hand gutter column (60px wide) displaying clear 24h labels: `08:00`, `09:00`, `10:00`, etc.
- **Event Block Positioning:** Absolute positioning based on event start time and duration, preventing visual overlaps through automatic column splitting.
