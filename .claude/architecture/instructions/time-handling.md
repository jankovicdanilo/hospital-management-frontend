# Time handling

Rules for every feature that shows, accepts, or filters by a date or
time. Read this together with api-conventions.md.

## What the API does

- Every `DateTime` is a UTC instant: an ISO 8601 string ending in `Z`.
- Calendar dates used as parameters (appointment `date`, `startDate`,
  `endDate`, free-slots `date`, statistics `from`/`to`) are UTC days,
  `yyyy-MM-dd`.
- Doctor schedule weekdays and hours are UTC. `startHour` is 0-23,
  `endHour` is 1-24 and after `startHour` (24 means the end of the
  UTC day), and only Monday to Friday are allowed.
- Free-slots takes a UTC `date` and returns each slot's `start` and
  `end` as UTC instants for that UTC day. Slots that have already
  started are omitted.
- The backend does no time zone conversion and holds no zone data.
- Invoice downloads take an optional `utcOffsetMinutes`: the clinic's UTC offset in minutes on the appointment's own date
  (not today's). The invoice prints the appointment time shifted by it, so it matches the screen.

## What the user sees

- Users see, and enter, times in the clinic time zone. It comes from
  config: `VITE_CLINIC_TIME_ZONE`. It is not hardcoded anywhere else.
- The browser's time zone is not the clinic's time zone.
- Statistics From and To are UTC days, labelled "UTC".
- Doctor schedules are shown and edited in clinic-local hours; users
  never see UTC for them. The frontend converts to and from the UTC
  hours the API uses, with the clinic's UTC offset on the next
  occurrence of that weekday, so the hours on a schedule match the
  slots shown for that day. A local working window that does not fit
  inside one UTC day is rejected with a clear message.

## Consequences to respect

- A clinic-local day can span two UTC days, so the slots for a local
  date can come from two UTC days of free slots, and a schedule window
  belongs to a local date only after conversion.
- A local date is bookable only if a schedule window overlaps it.
- Daylight saving: a local time that does not exist (the
  spring-forward gap) is not silently shifted; a local time that
  occurs twice (the fall-back hour) means the earlier occurrence; the
  same local hour is a different UTC hour in summer and in winter.
- An appointment's own slot stays selectable when it is being edited.

## Known limits

Schedules are fixed UTC hours inside one UTC day. A clinic whose local
working hours cross UTC midnight in some season cannot be represented
(Los Angeles 09:00-17:00 is 16:00-24:00 UTC in summer but 17:00-01:00
UTC in winter), and local opening hours move by one hour when daylight
saving changes. The app supports one clinic time zone at a time.
Because stored hours are fixed UTC, an existing schedule shows one hour earlier or later in local time after a
daylight-saving change; saving it again re-applies the intended local hours.

## Examples

| Clinic zone | Local time | UTC |
|---|---|---|
| Europe/Podgorica | Mon 19 Oct 2026 09:00 (CEST, UTC+2) | 07:00Z |
| Europe/Podgorica | Mon 26 Oct 2026 09:00 (CET, UTC+1) | 08:00Z |