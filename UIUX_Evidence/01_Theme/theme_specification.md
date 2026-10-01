# Theme Specification & Visual Foundations
**Group 6: Facilities, Resources & Reservations Platform**  
**Lead UI/UX Designer:** Member 2  
**Document Ref:** `UIUX-EV-01-THEME`

---

## 1. Design Philosophy
The University Services Platform interface is engineered to convey **professionalism, clinical clarity, operational efficiency, and trustworthiness**. It replaces legacy university paper/email reservation systems with a modern digital workspace that feels effortless for students and faculty while providing robust control for facilities managers.

---

## 2. Color Palette & Accessibility Compliance

### Brand Primary Palette
* **Primary Brand (`#1E40AF`):** Oxford Blue. Used for major calls-to-action (CTAs), primary navigation anchors, and primary headers.
  * Contrast ratio against pure white (`#FFFFFF`): **8.7:1** (Exceeds WCAG AAA standard of 7.0:1).
* **Secondary Brand (`#0F766E`):** Pine Teal. Used for secondary positive actions ("Book Now", success notifications, facility active tags).
  * Contrast ratio against pure white (`#FFFFFF`): **5.9:1** (Exceeds WCAG AA standard of 4.5:1).
* **Tertiary Accent (`#3B82F6`):** Vibrant Azure Blue. Used for interactive hover accents, focus rings, and link hovers.
  * Contrast ratio against `#1E293B` dark text: **4.6:1** (WCAG AA compliant).
* **Neutral Slate (`#64748B`):** Muted cool gray for subtitles, borders, labels, and inactive icons.

### Status Semantic Colors
* **Available / Confirmed (`#15803D` / bg `#F0FDF4`):** Emerald green indicator for verified reservations and operational facilities.
* **Pending Approval (`#B45309` / bg `#FFFBEB`):** Amber tone highlighting requests awaiting managerial approval.
* **Rejected / Inactive (`#B91C1C` / bg `#FEF2F2`):** Crimson red for denied bookings or decommissioned equipment.
* **Maintenance (`#334155` / bg `#F1F5F9`):** Neutral slate for scheduled downtime.

---

## 3. Typography Architecture

* **Primary Body & Interface:** `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
* **Heading & Display:** `Plus Jakarta Sans, Inter, sans-serif`
* **Hierarchy Standards:**
  * **H1 (Page Title):** 28px (1.75rem), Semi-Bold (600) / Extra-Bold (800), tracking `-0.025em`, color `#0F172A`.
  * **H2 (Section Header):** 20px (1.25rem), Bold (700), tracking `-0.02em`, color `#1E293B`.
  * **H3 (Card Header):** 16px (1.0rem), Semi-Bold (600), color `#0F172A`.
  * **Body Regular:** 14px (0.875rem), Regular (400), line-height `1.5`, color `#334155`.
  * **Caption / Small:** 12px (0.75rem), Medium (500), color `#64748B`.

---

## 4. Component Styles

### 4.1 Button System (`.btn`)
* **Primary Button (`.btn-primary`):** Background `#1E40AF`, text `#FFFFFF`, border-radius `10px`, hover elevation `-1px` translateY with glow shadow.
* **Secondary Button (`.btn-secondary`):** Background `#0F766E`, text `#FFFFFF`, border-radius `10px`.
* **Outline Button (`.btn-outline`):** Transparent background, 1px border `#CBD5E1`, text `#334155`, hover background `#F1F5F9`.
* **Danger Button (`.btn-danger`):** Background `#EF4444`, text `#FFFFFF`.
* **Icon Button (`.btn-icon`):** 40x40px square, rounded corners, subtle hover background `#F1F5F9`.

### 4.2 Form Control System (`.form-control`)
* Border: 1px solid `#CBD5E1`.
* Focus State: Border color `#3B82F6` with 3px halo `rgba(59, 130, 246, 0.15)`.
* Invalid State: Border color `#EF4444` with feedback text below input.

### 4.3 Badge System (`.badge`)
* Pill-shaped with `border-radius: 9999px`.
* Padding: `0.25rem 0.65rem`.
* Font size: `0.75rem`, font weight `600`.
* Color variants: Available, Pending, Rejected, Primary, Secondary.
