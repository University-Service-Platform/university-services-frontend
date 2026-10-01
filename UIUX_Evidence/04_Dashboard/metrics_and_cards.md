# Executive Dashboard Metrics & KPI Cards (USMG6-120, USMG6-61)
**Document Ref:** `UIUX-EV-04-METRICS-CARDS`  
**Component:** `StatsCard.tsx`, `DashboardPage.tsx`  
**Route:** `/dashboard` or `/`

---

## 1. Information Architecture & KPI Cards Grid

The top section of the dashboard features four synchronized KPI cards displaying critical operational indicators:

```text
+---------------------+ +---------------------+ +---------------------+ +---------------------+
| Total Facilities    | | Active Resources    | | Confirmed Bookings  | | Pending Approvals   |
| [Building2 Icon]    | | [Layers Icon]       | | [CalendarCheck2]    | | [AlertCircle Icon]  |
| 12                  | | 48                  | | 124                 | | 6                   |
| 100% operational    | | 92% available       | | +18% vs last month  | | Action Required     |
+---------------------+ +---------------------+ +---------------------+ +---------------------+
```

### Card Specification Details:
1. **Total Facilities Card:**
   - Icon: `Building2`, Brand Primary Blue (`#1E40AF`).
   - Metric: Count of facilities with status `ACTIVE`.
   - Subtext: "Operational campus centers".
2. **Active Resources Card:**
   - Icon: `Layers`, Brand Secondary Teal (`#0F766E`).
   - Metric: Count of resources available for general booking.
   - Subtext: "Ready for reservation".
3. **Confirmed Bookings Card:**
   - Icon: `CalendarCheck2`, Brand Tertiary Azure (`#3B82F6`).
   - Metric: Total approved bookings in the current calendar month.
   - Subtext: "Upcoming schedule load".
4. **Pending Approvals Card (Role-Gated):**
   - Icon: `Clock` / `AlertCircle`, Warning Amber (`#F59E0B`).
   - Metric: Active reservation requests awaiting review.
   - Click Action: Direct route link to `/approvals`.
   - Visible to: `FACILITY_MANAGER` and `ADMIN`. For students/lecturers, this card displays their personal active reservations count instead.
