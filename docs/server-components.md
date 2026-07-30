# Server Components

## `params` and `searchParams` are Promises — always `await` them

This project is on Next.js 15, where the breaking change is that dynamic APIs
passed to pages and layouts are asynchronous. This is a hard rule, not a
preference.

- `params` and `searchParams` props on a page or layout are typed as
  `Promise<...>`, not as plain objects.
- They **must** be `await`ed before their fields are read. Do not destructure
  or index into them synchronously — that reads a Promise object instead of
  the value and either breaks the build or silently produces `undefined`.
- Do not "fix" this by wrapping the component in `React.use()` as a shortcut
  inside a Server Component — `await` it directly, since the component
  function is already `async`.

```tsx
// app/dashboard/workout/[workoutId]/page.tsx
export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>
}) {
  const { workoutId } = await params

  // ...
}
```

- This applies the same way to `searchParams`:

```tsx
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>
}) {
  const { query } = await searchParams

  // ...
}
```

- Route Handlers (`app/api/**/route.ts`) receive `params` the same way — as a
  Promise that must be awaited — if they accept a dynamic segment. (Route
  Handlers must not be used for data fetching or mutation regardless; see
  `docs/data-fetching.md` and `docs/data-mutations.md`.)

## Page and layout components are `async` Server Components by default

- Do not add `"use client"` to a page or layout unless it has no choice but to
  use client-only APIs. Fetching and awaiting `params` requires the component
  to stay a Server Component.
- If part of the UI needs interactivity, keep the page/layout as a Server
  Component that awaits `params`, fetches data via a `/data` helper, and
  passes the resolved values down as props to a client child component. See
  `docs/data-fetching.md` for the fetch-in-Server-Component rule this
  supports.

## Validate dynamic segment values before using them

- Route params arrive as `string` (or `string[]` for catch-all routes), even
  when the value is conceptually a number or an enum. Convert and validate
  before passing the value into a `/data` helper.
- Call `notFound()` from `next/navigation` when a param fails to parse or the
  looked-up record doesn't exist (or doesn't belong to the current user — see
  `docs/auth.md`). Don't let an invalid param reach the database query
  unchecked.

```tsx
import { notFound } from "next/navigation"

const { workoutId } = await params
const id = Number(workoutId)

if (!Number.isInteger(id)) {
  notFound()
}
```

## Summary of the rules

1. `params` and `searchParams` are Promises on this Next.js version — always
   `await` them before reading fields off of them.
2. Pages and layouts stay `async` Server Components; push interactivity down
   into client child components instead of converting the page itself.
3. Convert and validate dynamic segment values (string → number/enum, existence,
   ownership) before using them, and call `notFound()` when validation fails.
