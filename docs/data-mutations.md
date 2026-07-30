# Data Mutations

## ALL data mutations must happen via Server Actions

This is a hard rule, not a preference.

- **Only Server Actions** may mutate data.
- Route Handlers (`app/api/**/route.ts`) **must not** be used for data mutations.
- Client Components **must not** mutate data directly — no `fetch` to a route handler, no direct DB calls.
- There is no other approved way to mutate data in this app.

## Server Actions must live in colocated `actions.ts` files

- Every Server Action must be defined in a file named `actions.ts`, colocated with the feature/route it belongs to (e.g. `app/dashboard/actions.ts`).
- Each file must start with `"use server"`.
- Do not define Server Actions inline inside component files.

## Server Action parameters must be typed — never `FormData`

- Server Actions must accept explicitly typed parameters (primitives, objects, etc.).
- The `FormData` type **must not** be used as a Server Action parameter type.
- If a form needs to call a Server Action, extract and type the individual values before calling it — do not pass the raw `FormData` object through.

## Every Server Action must validate its arguments with Zod

- Every Server Action must define a Zod schema for its parameters and parse/validate the incoming arguments at the top of the function before doing anything else.
- Never trust that TypeScript types alone are sufficient — TypeScript types are erased at runtime and do not protect against malformed or malicious input reaching a Server Action.
- If validation fails, the action must return/throw an error rather than proceeding.

```ts
// app/dashboard/actions.ts
"use server";

import { z } from "zod";
import { createWorkout } from "@/data/workouts";

const createWorkoutSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.coerce.date(),
});

export async function createWorkoutAction(
  input: z.infer<typeof createWorkoutSchema>
) {
  const { name, date } = createWorkoutSchema.parse(input);

  return createWorkout({ name, date });
}
```

## Database mutations must go through `/data` helpers

- Every database mutation (insert, update, delete) must be implemented as a helper function in the `src/data` directory.
- These helpers must use **Drizzle ORM** to perform the mutation.
- **Raw SQL is not allowed** — no `sql\`...\`` escape hatches, no raw driver queries.
- Server Actions call these `src/data` helpers directly; they never construct mutation queries themselves.

## Authorization: users can only mutate their own data

This is critical and must be enforced in every `src/data` helper that writes user-owned data:

- Every mutation must be scoped to the current authenticated user (e.g. filtered by `userId`).
- A logged-in user must **never** be able to update or delete another user's data, whether by guessing an ID, manipulating a request, or any other means.
- Do not rely on the UI to hide this — enforce the scoping in the mutation query itself, in the `src/data` helper.
- If a helper updates or deletes a record by ID, it must also filter by the current user's ID (or otherwise verify ownership) as part of the query, not as a separate check after the fact.

## Summary of the rules

1. Data mutations happen via Server Actions only — never in Route Handlers, never directly from Client Components.
2. Server Actions live in colocated `actions.ts` files, marked with `"use server"`.
3. Server Action parameters must be explicitly typed — `FormData` is not allowed as a parameter type.
4. Every Server Action validates its arguments with Zod before doing anything else.
5. Database mutations live in `src/data` helper functions and use Drizzle ORM — never raw SQL.
6. Every `src/data` mutation helper enforces that a user can only mutate their own data.
