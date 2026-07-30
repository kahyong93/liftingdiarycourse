@AGENTS.md

# Docs-first rule

Before generating or editing any code in this project, always check the
`/docs` directory (at the repo root) for a relevant standards document first,
and follow it. Do not skip this check because a task seems small or obvious.

### Code Generation Guidelines

Read the relevant document below before writing code that touches its area. If
more than one applies, all of them apply.

- [docs/auth.md](../docs/auth.md) — Authentication and authorization standards.
  This app uses Clerk for all auth.
- [docs/data-fetching.md](../docs/data-fetching.md) — Data fetching and database
  access standards (Server Components only, Drizzle via `/data` helpers).
- [docs/data-mutations.md](../docs/data-mutations.md) — Data mutation standards
  (Server Actions only, colocated `actions.ts`, typed params).
- [docs/ui.md](../docs/ui.md) — UI and component coding standards.

<!-- docs-list:end -->

When a new documentation file is added to `/docs`, add it to the list above.
