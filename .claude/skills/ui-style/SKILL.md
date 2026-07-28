---
name: ui-style
description: Use this skill when building or restyling any page, table, or card in the HospitalManagement frontend — covers visual style conventions (colors, cards, avatars, badges) to apply consistently across Patient/Doctor/Procedure pages.
---

# UI Style Conventions

## Overall direction
Modern SaaS dashboard feel: more visual hierarchy and color than a plain
table, while staying clean and uncluttered — not busy or noisy.

## Summary stat cards
List pages (Patients, Doctors, Procedures, Dashboard) should show a row
of small stat cards above the main table — e.g. total count, and one or
two other relevant numbers for that entity. Muted small label above a
larger bold number, on a light gray card background, no border.

## Avatar initials
Wherever a person's name is shown in a table row (Patient, Doctor), show
a small circular avatar with their initials before the name — light blue
background, blue text, consistent size (~36px).

## Status/info badges
Where a row has a categorical value worth highlighting (e.g. active/
inactive, a specialization, a price tier), show it as a small rounded
pill/badge with a tinted background and matching darker text color —
not just plain text. Use color meaningfully (e.g. green-ish for a
positive/active state), not decoratively.

## Buttons
Primary actions (Add Patient, Save Changes) should be a solid colored
button (blue background, white text). Secondary actions (Cancel, Edit)
stay as bordered/outline buttons like today. Destructive actions
(Delete) keep the red outline style already in use.

## Cards and spacing
Keep the existing rounded-corner card container style for tables and
forms. Favor a bit more breathing room (padding, gaps) over a dense
layout.