# Upcoming Reservations Section (USMG6-60)
**Document Ref:** `UIUX-EV-04-UPCOMING`  
**Component:** `DashboardPage.tsx`

---

## 1. Information Architecture & Card Layout

The Upcoming Reservations section provides a real-time list of imminent campus events and bookings:

```text
+---------------------------------------------------------------------------------+
| Upcoming Campus Reservations                                [ View All v ]      |
+---------------------------------------------------------------------------------+
| [ Today, 14:00 - 16:00 ]   Advanced Computing Lab 02      [ CONFIRMED ]        |
| Organized by: Dr. Samantha Perera (Faculty of Computing)                        |
| Purpose: CS302 Distributed Systems Practical Exam          [ Details ]         |
+---------------------------------------------------------------------------------+
| [ Tomorrow, 09:30 - 11:30] Main Auditorium 01             [ CONFIRMED ]        |
| Organized by: Prof. K. Jayasuriya (Vice Chancellor Office)                      |
| Purpose: Annual Dean's Academic Address                    [ Details ]         |
+---------------------------------------------------------------------------------+
| [ Sep 28, 10:00 - 12:00 ]  Physics Optics Darkroom         [ PENDING ]          |
| Organized by: S. Karunaratne (MSc Researcher)                                   |
| Purpose: Laser Diffraction Spectrometry                     [ Details ]         |
+---------------------------------------------------------------------------------+
```

### Key UX Specifications:
- **Filtering:** Past events are automatically excluded based on `reservation.date < today`.
- **Chronological Sorting:** Displayed in ascending order by start time.
- **Empty State:** Friendly graphic illustration with call to action: "No bookings scheduled in the next 7 days. Need a space? Browse campus availability."
- **Direct Interaction:** Clicking any reservation opens `ReservationDetailModal` to inspect full details, equipment needs, and approval history.
