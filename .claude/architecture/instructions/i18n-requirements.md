# i18n Requirements

## What we need
- UI text must support two languages: Montenegrin (ME) and English (EN)
- No hardcoded UI strings — every user-facing piece of text should be translatable
- All existing screens need their text migrated, not just new ones
- English and Montenegrin translations must stay in sync — no key exists in one language but not the other

## Status translation
- Appointment `Status` values (Completed, Pending, Cancelled, Missed,
  must display translated wherever they appear in the UI —
  Appointments list, Patient History table, Appointment Detail, Doctor
  schedule, etc.
- Map the raw enum value to a translation key (e.g. `status.completed`)
  and add both en/me entries — don't rely on the backend to translate
  this field, it's sent as the raw enum value everywhere except the
  invoice endpoint.

## Not in scope
- Backend responses, error codes, emails — these stay untranslated for now
- Exception: invoice generation and the patient summary endpoint accept
  a `language` param and return translated output — always pass the
  active locale to these two calls