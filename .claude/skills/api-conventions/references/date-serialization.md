# Date serialization

Backend `DateOnly` fields (e.g. dateOfBirth) serialize over JSON as
ISO date strings, e.g. "1990-05-14" — not full datetime strings, and
not JS Date objects.