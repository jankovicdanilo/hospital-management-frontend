## Feature: i18n-setup


- Set up i18next and migrate all existing hardcoded UI strings into en/me locale files.
- Add a language dropdown (ME/EN) to the layout header. Persist selection to localStorage and apply on load.
- Find every place in the UI that displays an appointment Status value
  and route it through the i18n status mapping instead of showing the
  raw enum string.

Before starting, read:
- instructions/i18n-requirements.md
- prompts/layout.md