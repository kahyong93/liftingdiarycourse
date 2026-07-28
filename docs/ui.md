# UI Coding Standards

## Rule

Only shadcn/ui components may be used for UI in this project. Do not create
custom components — including thin wrapper components around shadcn
components.

- Compose pages and features directly out of components in `components/ui`
  (installed via the shadcn CLI) plus plain HTML/Tailwind where composition
  is needed.
- If a needed component doesn't exist yet in `components/ui`, install it via
  the shadcn CLI rather than hand-writing it or wrapping existing shadcn
  components in a new custom component.
- Do not add files like `components/<feature>-card.tsx`,
  `components/<feature>-picker.tsx`, etc. Build the feature's markup inline
  in the page/route file using shadcn primitives.

## Rationale

Keeping all UI surface area to shadcn's generated components keeps the
component set consistent, auditable, and easy to update via the shadcn CLI.
Custom components (even thin wrappers) fragment this and create
project-specific UI code that shadcn updates won't cover.

## Practical implications

- Client-side interactivity (e.g. a date popover) is still fine — write the
  `"use client"` logic directly in the page/route file, or in a route-local
  file, using shadcn `Calendar`, `Popover`, `Button`, etc. Do not extract it
  into a new named component.
- `lib/utils.ts` (the shadcn-generated `cn` helper) and hooks in `hooks/` are
  not UI components and are unaffected by this rule.
- `components.json` in this project defines the shadcn config (style,
  aliases, icon library). Always install new UI pieces through the shadcn
  CLI so they land in `components/ui` and stay consistent with this config.
