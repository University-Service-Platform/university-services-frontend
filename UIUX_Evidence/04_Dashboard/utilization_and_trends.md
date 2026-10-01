# Resource Utilization & Trend Presentation
**Document Ref:** `UIUX-EV-04-UTILIZATION-TRENDS`

---

## 1. Capacity & Facility Utilization Gauges

To assist facility administrators in planning maintenance and managing space demand, the dashboard presents dynamic utilization progress meters:

```text
+---------------------------------------------------------------------------------+
| Campus Facility Space Utilization                                              |
|                                                                                 |
| Faculty of Computing Complex (IT Building)                                      |
| [====================================================-------] 82% Booked        |
|                                                                                 |
| Science Faculty Research Laboratories                                           |
| [====================================-----------------------] 64% Booked        |
|                                                                                 |
| Main University Library Study Rooms                                             |
| [===========================================================] 94% Peak Demand   |
|                                                                                 |
| Engineering Innovation Workshop                                                 |
| [=======================------------------------------------] 45% Booked        |
+---------------------------------------------------------------------------------+
```

### UX Design Details:
- **Calculation Basis:** Operating hours booked vs. total available campus hours (08:00 - 20:00).
- **Color Progression:**
  - `0% - 60%`: Calm Teal (`#0F766E`) — Optimal availability.
  - `61% - 85%`: Vibrant Blue (`#3B82F6`) — High healthy demand.
  - `86% - 100%`: Amber / Red (`#F59E0B` / `#EF4444`) — Near capacity, warning of high contention.

---

## 2. Weekly Demand Distribution Trend

A visual distribution displays reservation frequency across days of the week:
- Identifies campus usage patterns (e.g., peak laboratory utilization occurs Tuesday and Thursday afternoons).
- Supports data-driven facility decisions such as scheduling deep maintenance on low-utilization windows (Friday evening / Saturday).
