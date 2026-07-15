# i18n Audit

## Goal

Make Stoicheia fully localizable, starting with Greek, French, Italian, German, Spanish, Russian, Portuguese, Polish, Turkish, Dutch, Simplified Chinese, Japanese and Arabic as the first complete non-English languages.

## Current Architecture

- `src/i18n.ts` keeps shared language types, language options, fallback logic, English defaults, and non-Greek Settings translations.
- `src/i18n/el.ts` owns the Greek vocabulary.
- `src/i18n/fr.ts` owns the French vocabulary.
- `src/i18n/it.ts` owns the Italian vocabulary.
- `src/i18n/de.ts` owns the German vocabulary.
- `src/i18n/es.ts` owns the Spanish vocabulary.
- `src/i18n/ru.ts` owns the Russian vocabulary.
- `src/i18n/pt.ts` owns the Portuguese vocabulary.
- `src/i18n/pl.ts` owns the Polish vocabulary.
- `src/i18n/tr.ts` owns the Turkish vocabulary.
- `src/i18n/nl.ts` owns the Dutch vocabulary.
- `src/i18n/zh.ts` owns the Simplified Chinese vocabulary.
- `src/i18n/ja.ts` owns the Japanese vocabulary.
- `src/i18n/ar.ts` owns the Arabic vocabulary.
- `vite.config.ts` splits locale modules into an `i18n-locales` chunk so adding full vocabularies does not bloat the main application chunk.
- New UI translation access goes through `getUiTranslation(language)`.
- Settings translations continue through `getSettingsPageTranslation(language)`.
- Arabic strings are available now; a dedicated RTL layout pass is still recommended before considering Arabic visually complete.

## Covered In The Greek/French/Italian/German/Spanish/Russian/Portuguese/Polish/Turkish/Dutch/Simplified Chinese/Japanese/Arabic Pass

- Settings page Greek, French, Italian, German, Spanish, Russian, Portuguese, Polish, Turkish, Dutch, Simplified Chinese, Japanese and Arabic vocabularies moved out of `src/i18n.ts`.
- App shell labels:
  - Source / Styles tabs
  - Live / Setup badges
  - Interactive canvas title
  - Preview kicker
  - resize labels and tooltips
- Header menu:
  - File, Edit, Insert, View, Styles, Help
  - status labels and user notifications
  - common toolbar chips and header tooltips
  - About Stoicheia text remains updated for tkz-euclide 5.13c
- Canvas controls:
  - preview mode labels
  - grid / axes / measurements / snap / labels controls
  - zoom and fit-view tooltips
  - interaction help tooltip
- Toolbar:
  - all group names
  - all section names
  - all registered tool labels and descriptions
- Command palette:
  - shell labels, placeholders, empty state, categories
  - workspace/canvas/preview actions
  - tool actions reuse the translated toolbar vocabulary

## Bundle Note

The full UI vocabularies are split into the `i18n-locales` build chunk. This keeps the main application bundle under budget while preserving synchronous translation lookup at runtime.

## Remaining Hardcoded Areas

- Dialogs:
  - point/triangle/circle construction dialogs
  - measurement dialogs
  - transformation dialogs
  - random point, ellipse, radical axis, duplicate segment dialogs
- Inspector and properties panel:
  - section titles
  - form labels
  - validation/help text
  - action buttons
- Style manager:
  - profile names/descriptions
  - style option labels
  - create/apply actions
- Object tree and construction history:
  - empty states
  - object/group labels where user-facing text is not generated from geometry commands
- Status bar and compiler diagnostics:
  - user-facing status text and diagnostics summaries

## Next Implementation Order

1. Dialog vocabulary by component, starting with the most-used creation dialogs.
2. Inspector/property vocabulary, with helpers for repeated labels like Color, Placement, Text, Apply.
3. Style manager vocabulary.
4. Object tree, construction history and status bar vocabulary.
5. Add i18n coverage tests that render Greek for each major surface.
