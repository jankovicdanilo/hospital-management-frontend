# Handling inconsistencies between files

If you find two files disagreeing (e.g. an env var name, a type shape,
a route path), do not silently resolve it by picking one side. Flag
the discrepancy and ask which one is correct — don't assume the older
or "example" file is the source of truth.