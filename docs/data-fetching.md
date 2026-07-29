# Data Fetching

## ALL data fetching must happen in Server Components

This is a hard rule, not a preference.

- **Only Server Components** may fetch data.
- Route Handlers (`app/api/**/route.ts`) **must not** be used for data fetching.
- Client Components (`"use client"`) **must not** fetch data — no `fetch`, no SWR/React Query, no direct DB calls.
- There is no other approved way to fetch data in this app.

If a client component needs data, the parent Server Component fetches it and passes it down as props.

## Database access must go through `/data` helpers

- Every database query must be implemented as a helper function in the `/data` directory.
- These helpers must use **Drizzle ORM** to query the database.
- **Raw SQL is not allowed** — no `sql\`...\`` escape hatches, no raw driver queries.
- Server Components call these `/data` helpers directly; they never construct queries themselves.

## Authorization: users can only access their own data

This is critical and must be enforced in every `/data` helper that reads or writes user-owned data:

- Every query must be scoped to the current authenticated user (e.g. filtered by `userId`).
- A logged-in user must **never** be able to read, update, or delete another user's data, whether by guessing an ID, manipulating a request, or any other means.
- Do not rely on the UI to hide other users' data — enforce the scoping in the query itself, in the `/data` helper.
- If a helper fetches a record by ID, it must also filter by the current user's ID (or otherwise verify ownership) as part of the query, not as a separate check after the fact.

## Summary of the rules

1. Data fetching happens in Server Components only — never in Route Handlers, never in Client Components.
2. Database queries live in `/data` helper functions and use Drizzle ORM — never raw SQL.
3. Every `/data` helper enforces that a user can only access their own data.
