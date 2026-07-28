# Dashboard Page Design

Date: 2026-07-29

## Goal

Add a `/dashboard` page (in `my-clerk-next-app`) that shows the signed-in user's
logged workouts for a selectable date, defaulting to today.

## Auth

- `/dashboard` requires sign-in. Use Clerk's `auth.protect()` server-side at
  the top of the page component; signed-out users are redirected to sign-in.
- Use `auth()` to get the current `userId`, used to scope the workout query.

## Routing & date state

- Date is carried in the URL: `?date=YYYY-MM-DD` search param.
- If absent or invalid, default to today's date (server local date).
- The page is a server component; changing the date via the datepicker
  navigates (`router.push`) to the same route with the new `date` param,
  triggering a fresh server render — no client-side data fetching/API route.

## Data fetching

- Query directly with Drizzle in the server component (no API route).
- Fetch `workouts` where `userId = current user` and `startedAt` is within
  `[date 00:00, date+1 00:00)` (local calendar day for the given date).
- For each workout, join `workoutExercises` → `exercises`, and each
  `workoutExercise`'s `sets`.
- Order: workouts by `startedAt`; exercises by `workoutExercises.order`;
  sets by `setNumber`.

## Components

Per `docs/ui.md`: only shadcn/ui components are used; no custom components
(including thin wrappers) are created. All markup lives directly in the
route's files.

- `app/dashboard/page.tsx` (server component): reads `searchParams.date`,
  runs the Drizzle query, and renders the results inline using shadcn `Card`
  (or similar) primitives — one card per workout, each listing its exercises
  and sets directly in JSX. Renders the empty state
  ("No workouts logged on this date") inline when no workouts are found.
- `app/dashboard/date-picker-client.tsx` (`"use client"`, route-local file,
  not under `components/`): the interactive date-selection piece, built
  directly from shadcn `Calendar` + `Popover` + `Button` primitives with no
  wrapping abstraction beyond what's needed to hold the `"use client"`
  boundary. Shows the currently selected date; on select, pushes the new
  `?date=` URL via `useRouter`.

## Setup

- Install shadcn `calendar`, `popover`, and `card` components (only `button`
  exists in `components/ui` currently).

## Error handling

- Malformed/unparseable `date` query param: fall back to today rather than
  erroring.

## Out of scope

- Creating/editing/deleting workouts from this page.
- Client-side/API-route based fetching.
- Timezone handling beyond using the server's local date interpretation of
  the `date` param (no per-user timezone preference).
