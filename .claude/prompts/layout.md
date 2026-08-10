# Prompt: Layout (Header/Footer)

What this produces: a shared layout wrapping all authenticated pages
(dashboard and anything added later), applied globally except for the
login page, which stays standalone. Assumes project-wide conventions
(style, scope discipline, tooling rules) are already defined in CLAUDE.md.

Prerequisite: run this only after the login feature prompt has already
been applied and merged into the codebase — this prompt depends on the
existing routing and auth context/hook being present as real files to
read, not just described in a separate prompt.

---

Add a shared layout for all authenticated pages in this app.

Requirements:
- Applies globally to every authenticated route (dashboard and any
  pages added later)
- Does not apply to the login page, which stays standalone
- Header: the current logged-in user's name, with a logout button in
  the top-right corner
- Footer: a copyright line crediting Danilo Jankovic and Aleksei Kudriavtsev
- The dashboard page currently only has placeholder text — replace it
  with a simple welcome view showing the logged-in user's username,
  email, and role