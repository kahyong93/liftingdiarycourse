# Create Workout Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/dashboard/workout/new`, a page with a form that creates a new workout (name + started-at date/time) for the signed-in user.

**Architecture:** A Server Component page renders a client form built from shadcn primitives (`Input`, `Label`, `Calendar`, `Popover`, `Button`, `Card`). The client form calls a typed Server Action (`createWorkoutAction` in `app/dashboard/actions.ts`), which validates input with Zod and delegates the insert to a new `/data` helper (`createWorkout` in `data/workouts.ts`) that scopes the write to the authenticated user. On a successful result the client redirects to `/dashboard` via `useRouter`; the action itself never redirects.

**Tech Stack:** Next.js App Router (Server Components + Server Actions), Drizzle ORM (`neon-http`), Clerk (`@clerk/nextjs/server`), Zod, shadcn/ui (`base-nova` style, `lucide` icons), Tailwind.

## Global Constraints

- Only Server Components fetch data; only Server Actions mutate data (`docs/data-fetching.md`, `docs/data-mutations.md`).
- Server Actions live in colocated `actions.ts` files starting with `"use server"`; params are explicitly typed, never `FormData` (`docs/data-mutations.md`).
- Every Server Action validates its args with Zod before doing anything else (`docs/data-mutations.md`).
- Database mutations go through `/data` helpers using Drizzle only — no raw SQL (`docs/data-mutations.md`).
- Every `/data` helper that writes user-owned data resolves `userId` itself via `await auth()` and scopes the write to it; never accepts `userId` as a param (`docs/auth.md`, `docs/data-fetching.md`).
- Only shadcn/ui components are used; no custom wrapper components — compose pages directly from `components/ui` + Tailwind, inline in route files (`docs/ui.md`).
- `/dashboard(.*)` is already a protected route in `proxy.ts` — no proxy changes needed.
- The Server Action must not call `redirect()`; navigation after success happens client-side via `useRouter`.

---

### Task 1: Install missing shadcn components

**Files:**
- Create (via CLI): `components/ui/input.tsx`
- Create (via CLI): `components/ui/label.tsx`

**Interfaces:**
- Produces: `Input` (`@/components/ui/input`, standard shadcn `React.ComponentProps<"input">` wrapper) and `Label` (`@/components/ui/label`, standard shadcn Radix/Base-UI label wrapper), for Task 4 to import.

- [ ] **Step 1: Install `input` and `label` via the shadcn CLI**

Run:
```bash
cd my-clerk-next-app
npx shadcn@latest add input label
```

- [ ] **Step 2: Verify the files were created**

Run: `ls components/ui/input.tsx components/ui/label.tsx`
Expected: both files exist.

- [ ] **Step 3: Commit**

```bash
git add components/ui/input.tsx components/ui/label.tsx components.json 2>/dev/null
git commit -m "chore: add shadcn input and label components"
```
(If `components.json` is unchanged, `git add` on it is a no-op — that's fine.)

---

### Task 2: Add `createWorkout` data helper

**Files:**
- Modify: `data/workouts.ts`

**Interfaces:**
- Consumes: `db` from `@/db` (Drizzle instance with `relations`, see `db/index.ts`), `workouts` table from `@/db/schema` (`db/schema.ts:19-28`, columns: `id serial`, `userId text`, `name text nullable`, `startedAt timestamp notNull defaultNow`, `completedAt timestamp nullable`, `createdAt timestamp notNull defaultNow`).
- Produces: `createWorkout(input: { name?: string; startedAt: Date }): Promise<{ id: number; userId: string; name: string | null; startedAt: Date; completedAt: Date | null; createdAt: Date }>` — for Task 3 to call. Throws `Error("Not authenticated")` when there is no signed-in user.

- [ ] **Step 1: Add the helper**

Add to `data/workouts.ts` (below the existing `getWorkoutsForCurrentUser`, keep the existing imports and add `workouts` from the schema):

```ts
import "server-only"

import { auth } from "@clerk/nextjs/server"

import { db } from "@/db"
import { workouts } from "@/db/schema"

// ... existing WorkoutWithExercises type and getWorkoutsForCurrentUser stay unchanged ...

export async function createWorkout(input: { name?: string; startedAt: Date }) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Not authenticated")
  }

  const [workout] = await db
    .insert(workouts)
    .values({
      userId,
      name: input.name ?? null,
      startedAt: input.startedAt,
    })
    .returning()

  return workout
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `cd my-clerk-next-app && npx tsc --noEmit`
Expected: no errors referencing `data/workouts.ts`.

- [ ] **Step 3: Commit**

```bash
git add data/workouts.ts
git commit -m "feat: add createWorkout data helper"
```

---

### Task 3: Add `createWorkoutAction` Server Action

**Files:**
- Create: `app/dashboard/actions.ts`

**Interfaces:**
- Consumes: `createWorkout` from `@/data/workouts` (Task 2's exact signature: `createWorkout(input: { name?: string; startedAt: Date }): Promise<Workout>`).
- Produces: `createWorkoutAction(input: { name?: string; startedAt: Date }): Promise<{ success: true; workout: { id: number; userId: string; name: string | null; startedAt: Date; completedAt: Date | null; createdAt: Date } } | { success: false; error: string }>` — for Task 4's client form to call. Never calls `redirect()`.

- [ ] **Step 1: Write the action**

```ts
"use server"

import { z } from "zod"

import { createWorkout } from "@/data/workouts"

const createWorkoutSchema = z.object({
  name: z.string().max(100).optional(),
  startedAt: z.coerce.date(),
})

export async function createWorkoutAction(
  input: z.infer<typeof createWorkoutSchema>
) {
  const parsed = createWorkoutSchema.safeParse(input)

  if (!parsed.success) {
    return { success: false as const, error: "Invalid workout details." }
  }

  try {
    const workout = await createWorkout(parsed.data)
    return { success: true as const, workout }
  } catch {
    return { success: false as const, error: "Could not create workout." }
  }
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `cd my-clerk-next-app && npx tsc --noEmit`
Expected: no errors referencing `app/dashboard/actions.ts`.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/actions.ts
git commit -m "feat: add createWorkoutAction server action"
```

---

### Task 4: Build the `/dashboard/workout/new` page and form

**Files:**
- Create: `app/dashboard/workout/new/page.tsx`

**Interfaces:**
- Consumes: `createWorkoutAction` from `@/app/dashboard/actions` (Task 3's exact signature). shadcn components: `Button`, `Card`/`CardContent`/`CardHeader`/`CardTitle` (`@/components/ui/card`), `Calendar` (`@/components/ui/calendar`), `Popover`/`PopoverTrigger`/`PopoverContent` (`@/components/ui/popover`), `Input` (`@/components/ui/input`, Task 1), `Label` (`@/components/ui/label`, Task 1).
- Produces: default-exported page component at route `/dashboard/workout/new`. No other task depends on this file.

- [ ] **Step 1: Write the page**

The page is a single file: a thin Server Component default export wrapping a `"use client"` form defined in the same file below it (matching `docs/ui.md`'s "no new named component files" rule — this stays one route file, not a split into a separate client component file).

```tsx
import { NewWorkoutForm } from "./new-workout-form"

export default function NewWorkoutPage() {
  return <NewWorkoutForm />
}
```

- [ ] **Step 2: Write the client form in a route-local file**

Per `docs/ui.md`, route-local client logic for a page may live in a file colocated with the route (not a named "component" abstracted elsewhere) — create `app/dashboard/workout/new/new-workout-form.tsx`:

```tsx
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { createWorkoutAction } from "../../actions"

export function NewWorkoutForm() {
  const router = useRouter()
  const [name, setName] = React.useState("")
  const [date, setDate] = React.useState<Date>(() => new Date())
  const [time, setTime] = React.useState(() => format(new Date(), "HH:mm"))
  const [error, setError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const [hours, minutes] = time.split(":").map(Number)
    const startedAt = new Date(date)
    startedAt.setHours(hours, minutes, 0, 0)

    const result = await createWorkoutAction({
      name: name.trim() === "" ? undefined : name.trim(),
      startedAt,
    })

    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    router.push("/dashboard")
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">New Workout</h1>
      <Card>
        <CardHeader>
          <CardTitle>Workout details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="workout-name">Name (optional)</Label>
              <Input
                id="workout-name"
                value={name}
                onChange={(changeEvent) => setName(changeEvent.target.value)}
                maxLength={100}
                placeholder="Leg day"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className="w-fit justify-start gap-2"
                    >
                      <CalendarIcon className="size-4" />
                      {format(date, "PPP")}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selected) => {
                      if (selected) setDate(selected)
                    }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="workout-time">Time</Label>
              <Input
                id="workout-time"
                type="time"
                value={time}
                onChange={(changeEvent) => setTime(changeEvent.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create workout"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Verify it type-checks**

Run: `cd my-clerk-next-app && npx tsc --noEmit`
Expected: no errors referencing `app/dashboard/workout/new/`.

- [ ] **Step 4: Manual verification**

Run: `cd my-clerk-next-app && npm run dev`

In a browser, signed in:
1. Navigate to `/dashboard/workout/new`.
2. Submit with a name and today's date/time → expect redirect to `/dashboard` and the new workout visible on today's calendar entry.
3. Navigate back to `/dashboard/workout/new`, submit with no name and a past date → expect redirect to `/dashboard` and the workout visible under "Workout" (fallback title) on that past date.
4. Confirm signed-out access to `/dashboard/workout/new` redirects to sign-in (via the existing `proxy.ts` matcher).

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/workout/new/
git commit -m "feat: add /dashboard/workout/new page with create-workout form"
```

---

## Self-Review Notes

- **Spec coverage:** route (Task 4), form fields (Task 4), UI implementation via shadcn only (Tasks 1, 4), Server Action (Task 3), data helper (Task 2), client-side navigation (Task 4), error handling (Tasks 3, 4), manual testing (Task 4 Step 4) — all covered.
- **No placeholders:** all steps contain full code or exact commands.
- **Type consistency:** `createWorkout(input: { name?: string; startedAt: Date })` (Task 2) matches the type `createWorkoutAction` passes through (Task 3) matches what the form builds and sends (Task 4).
