# Resource Management Validation Rules & State Designs
**Document Ref:** `UIUX-EV-02-VALIDATION-STATES`

---

## 1. Validation Logic Matrix

| Field | Trigger | Invalid Condition | Error Display & UX Behavior |
|---|---|---|---|
| **Resource Name** | Blur / Submit | Empty, length < 3, length > 80 | Input highlighted red; text "Resource name must be between 3 and 80 characters." |
| **Facility Selection** | Blur / Submit | Not selected (`""` or `"ALL"`) | Select dropdown highlighted red; text "Please select a valid parent facility." |
| **Capacity** | Blur / Submit | Value <= 0 or Non-integer | Text "Capacity must be a positive integer (min 1)." |
| **Location** | Blur / Submit | Empty string | Text "Please provide room/floor location." |

---

## 2. Interface State Designs

### 2.1 Loading State
- Rendered during asynchronous REST queries.
- Card grid displays 3 subtle animated skeleton placeholder cards with shimmering background effect.
- Prevents user interaction until data is ready.

### 2.2 Empty State
- Displayed when no resources match the active filters or search terms.
- Visual: Large centered SVG icon (`Layers`, color `#94A3B8`).
- Heading: "No matching resources found".
- Body: "Try changing your search terms, selecting a different facility, or reset your filters."
- Button: `Clear Filters` (primary outline).

### 2.3 Error State
- Displayed on network failure or API 500 error.
- Visual: Red warning alert banner with retry trigger.
- Message: "Unable to communicate with the Resource Service. Please verify your connection."
- Button: `Retry Now`.

### 2.4 Status Change Confirmation Flow
- When an administrator modifies a resource status from `AVAILABLE` to `MAINTENANCE` or `INACTIVE`:
  - A confirmation dialog appears explaining the impact:
  - "Warning: Changing this resource to Maintenance will block all new booking requests for this resource."
  - Primary button: `Confirm Status Change` (in `#B45309`).
  - Secondary button: `Cancel`.
