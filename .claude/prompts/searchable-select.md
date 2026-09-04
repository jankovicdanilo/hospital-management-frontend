# SearchableSelect Component

Single-select dropdown for choosing exactly one option from a large
or paginated dataset that isn't fully loaded client-side — searches
the backend rather than filtering an already-fetched list (unlike
MultiSelectDropdown, which filters client-side because its full
dataset is already loaded upfront).

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
- Accepts an optional `fetchPopularOptions` callback: before any
  search is typed, the dropdown shows this default list instead of
  the "type at least 3 characters" hint (e.g. wired to a
  `GET /.../popular?count=5` endpoint). Loads lazily the first time
  the dropdown opens and is cached for the component's lifetime once
  it succeeds; a failed load is not cached, so it retries next time
  the dropdown opens.
