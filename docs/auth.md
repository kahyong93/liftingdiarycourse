# Auth

## Clerk is the only authentication system

This app uses **Clerk** (`@clerk/nextjs`) for all authentication and session
management. This is a hard rule, not a preference.

- Do **not** add another auth provider (NextAuth/Auth.js, Supabase Auth, Lucia,
  Passport, etc.).
- Do **not** hand-roll auth — no custom password hashing, no custom session
  cookies, no custom JWT issuing or verification.
- Do **not** store passwords, password resets, email-verification tokens, or
  session rows in our database. Clerk owns all of that.

## Import from the right entry point

Clerk splits its API into two entry points, and mixing them up breaks the build.

- `@clerk/nextjs` — React components and hooks. Use in layouts, pages, and
  client components (`ClerkProvider`, `Show`, `SignIn`, `SignUp`,
  `SignInButton`, `SignUpButton`, `UserButton`).
- `@clerk/nextjs/server` — server-side APIs. Use in the proxy/middleware,
  Server Components, and `/data` helpers (`auth`, `clerkMiddleware`,
  `createRouteMatcher`, `currentUser`).

Never import from `@clerk/clerk-react`, `@clerk/backend`, or any other Clerk
package directly.

## `ClerkProvider` is mounted once, in the root layout

`ClerkProvider` wraps the app in `app/layout.tsx` and nowhere else. Do not add a
second provider in a nested layout, page, or component.

## Route protection happens in `proxy.ts`

Protection is centralized in `proxy.ts` at the app root (this Next.js version's
replacement for `middleware.ts` — do not create a `middleware.ts`).

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});
```

- Routes are **protected by opt-in**: everything is public unless it matches
  `isProtectedRoute`. When you add a route that requires a signed-in user, add
  its pattern to `createRouteMatcher` in the same change as the route itself.
- Use `await auth.protect()` to gate a route. It redirects unauthenticated users
  to sign-in for you — don't write manual redirect logic in pages.
- Do not add per-page auth guards as a substitute for the matcher. The proxy is
  the single source of truth for which routes require a session.

## Reading the current user

- In Server Components and `/data` helpers, get the user with
  `const { userId } = await auth()` from `@clerk/nextjs/server`. It is `async` —
  always `await` it.
- Use `currentUser()` only when you need profile fields (name, email, image).
  For ownership checks and queries, `userId` from `auth()` is enough and is
  cheaper.
- Never pass a `userId` in from a prop, query string, route param, form field,
  or request body to decide whose data to load. The identity always comes from
  `auth()` on the server.
- Never read the current user in a client component in order to fetch or filter
  data. See `docs/data-fetching.md` — the parent Server Component fetches and
  passes data down.

## Every `/data` helper derives the user itself

This is the security boundary of the app. Each helper that touches user-owned
data calls `auth()` itself and scopes the query to that `userId`:

```ts
import "server-only"

import { auth } from "@clerk/nextjs/server"

export async function getWorkoutsForCurrentUser() {
  const { userId } = await auth()

  if (!userId) {
    return []
  }

  return db.query.workouts.findMany({ where: { userId } })
}
```

- `/data` modules start with `import "server-only"` so they can never be pulled
  into a client bundle.
- A helper must never accept a `userId` argument. It resolves the caller's
  identity from `auth()`.
- Handle the unauthenticated case explicitly — return an empty result for reads,
  throw for writes. Never fall through to an unscoped query.
- Writes must scope by `userId` in the `where` clause of the update/delete
  itself, not as a separate "check then write" step.
- `userId` columns store the **Clerk user ID** (`user_...`) as `text`. We do not
  keep our own users table or numeric user IDs.

## Rendering by auth state

Use Clerk's declarative components rather than branching on hook values:

```tsx
<Show when="signed-out">
  <SignInButton mode="modal" />
</Show>
<Show when="signed-in">
  <UserButton />
</Show>
```

Auth-state rendering is a UI convenience only. It must never be the thing that
keeps one user's data away from another — that is enforced in the query.

## Sign-in and sign-up routes

- The catch-all routes `app/sign-in/[[...sign-in]]/page.tsx` and
  `app/sign-up/[[...sign-up]]/page.tsx` render Clerk's `<SignIn />` and
  `<SignUp />`. Keep the optional catch-all segments — Clerk needs them for its
  multi-step flows (verification, MFA, SSO callbacks).
- Do not build custom sign-in or sign-up forms. Style the Clerk components via
  their `appearance` prop instead.
- These routes stay public — never add them to `isProtectedRoute`.

## Secrets and environment

- Clerk keys live in `.env.local`, which is git-ignored. Never commit keys.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is public by design; `CLERK_SECRET_KEY`
  is server-only and must never be referenced in a client component or prefixed
  with `NEXT_PUBLIC_`.
- Read Clerk config from the environment, never hardcode instance IDs, keys, or
  Clerk domains in source.

## Summary of the rules

1. Clerk is the only auth system — no alternatives, no hand-rolled auth, no
   credentials in our database.
2. `ClerkProvider` is mounted once, in the root layout.
3. Route protection is centralized in `proxy.ts` via `createRouteMatcher` +
   `auth.protect()`.
4. Server code gets identity from `await auth()` — never from client input.
5. Every `/data` helper resolves `userId` itself and scopes every query to it.
6. Clerk's built-in components handle sign-in, sign-up, and auth-state
   rendering; UI gating is never a security control.
7. `CLERK_SECRET_KEY` stays server-side and out of version control.
