# Create Workout Page — Design

## Summary

Add `/dashboard/workout/new`, a form page for creating a new workout. The
form captures workout metadata only (name, started-at date/time); exercises
and sets are added later through a separate feature.

## Route

`app/dashboard/workout/new/page.tsx` — a Server Component page. It is
already covered by the `/dashboard(.*)` matcher in `proxy.ts`, so no changes
to route protection are needed.

## Form fields

- **Name** — optional text input, max 100 characters.
- **Started at** — date + time, defaulting to the current moment, editable
  so a user can log a past workout. Built from the existing shadcn
  `Calendar`/`Popover` pattern already used on the dashboard, plus a time
  input.

## UI implementation

Per `docs/ui.md`, only shadcn/ui components are used, composed directly in
route files — no new custom wrapper components. `Button`, `Calendar`,
`Popover`, and `Card` are already installed in `components/ui`; `Input` and
`Label` are not yet installed and must be added via the shadcn CLI.

The interactive form (date/time picker state, submission, error display) is
a `"use client"` sub-tree colocated in the `workout/new` route (e.g.
`app/dashboard/workout/new/page.tsx` split into a server page wrapper and an
inline client form section in the same route folder) — not a new named
component file, per the no-custom-components rule.

## Server Action

New file `app/dashboard/actions.ts` (colocated at the `dashboard` route
level), per `docs/data-mutations.md`:

- `"use server"` at the top of the file.
- `createWorkoutAction` accepts a typed, explicit parameter object — never
  `FormData`.
- Validates input with a Zod schema:
  `{ name: z.string().max(100).optional(), startedAt: z.coerce.date() }`.
- Calls the new `createWorkout` helper in `data/workouts.ts`.
- Returns a result value (`{ success: true, workout }` or
  `{ success: false, error: string }`) — it does **not** call `redirect()`.
  Navigation after success happens client-side (see below).

## Data helper

New function `createWorkout(input)` in `data/workouts.ts`, per
`docs/data-fetching.md` / `docs/auth.md`:

- `import "server-only"`.
- Resolves `userId` via `await auth()` itself; throws if unauthenticated
  (this is a write, so it must not fail silently).
- Inserts into the `workouts` table scoped with that `userId` via Drizzle.
- Returns the created workout row.

## Client-side navigation

The client form component calls `createWorkoutAction` directly (not via
`<form action={...}>`, since the action needs typed params rather than
`FormData`). On a successful result, it calls `router.push("/dashboard")`
using `useRouter` from `next/navigation`. On an error result, it displays
the error message inline in the form and does not navigate.

## Error handling

- Zod validation failure in the action → returns
  `{ success: false, error: ... }`.
- Unauthenticated → the `/data` helper throws; the action catches this and
  returns a generic error result rather than letting it propagate as an
  unhandled exception.
- The client form renders any returned error message inline (e.g. below the
  submit button) rather than crashing or silently failing.

## Testing

No automated test setup exists yet in this repo. Verification is manual:

- Submit with a name and a future/past started-at date.
- Submit with no name (optional field).
- Confirm the created workout appears on the correct day in the dashboard
  calendar view after redirect.
