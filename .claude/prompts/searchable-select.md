# SearchableSelect Component

If `src/components/SearchableSelect.tsx` already exists, import and
use it — do not redefine this per-feature.

If it does not exist yet, create it with this shape:

Single-select dropdown for choosing exactly one option from a large
or paginated dataset that isn't fully loaded client-side — searches
the backend rather than filtering an already-fetched list (unlike
MultiSelectDropdown, which filters client-side because its full
dataset is already loaded upfront).

## Props

- `value: string | number | null` — the currently selected option's id
- `onChange: (value: string | number | null) => void`
- `fetchOptions: (search: string) => Promise<{ id: string | number; label: string }[]>`
  — a function the component calls to fetch matching options; the
  calling feature wires this to the correct endpoint (e.g.
  `GET /api/doctor?search=...`, `GET /api/patient?search=...`)
- `placeholder?: string`
- `disabled?: boolean`

## Behavior

- Debounces the search input by 300ms before calling `fetchOptions`
- Requires a minimum of 3 characters typed before triggering a search
  (shows a hint like "Type at least 3 characters to search" below
  that threshold)
- Shows a loading state while a search request is in flight
- Shows a "no results" state if a search returns nothing
- Once an option is selected, closes/collapses and displays the
  selected option's label
- `fetchOptions` should request a larger page size (e.g. 100) rather
  than the component itself implementing pagination — if a search is
  narrow enough that more than 100 results come back, that's a signal
  the user should narrow their search further, not something this
  component needs to paginate through