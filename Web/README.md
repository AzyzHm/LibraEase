# LibraEase Frontend

Angular client for LibraEase, a library management system. Talks to the [`Server`](../../Server) API for everything, there's no local database or mock data layer.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Architecture](#architecture)
- [Routing & Guards](#routing--guards)
- [State Management](#state-management)
- [API Layer](#api-layer)
- [Authentication](#authentication)
- [Styling](#styling)
- [Data Models](#data-models)
- [Testing](#testing)
- [Known Quirks](#known-quirks)

## Tech Stack

- **Framework**: Angular 20, standalone components (no `NgModule`s), Signals for state
- **Styling**: Tailwind CSS v4, design tokens defined in `src/styles.css`
- **HTTP**: Angular's `HttpClient`, with a functional interceptor for auth
- **Testing**: Jest + `jest-preset-angular` for unit/integration, `@testing-library/angular` for component rendering, Playwright for e2e
- **Linting/formatting**: ESLint (flat config, `angular-eslint`) + Prettier, enforced on commit via Husky/lint-staged

## Project Structure

```
Web/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── api/           # HttpClient wrappers, one per backend resource
│   │   │   ├── guards/         # route guards (auth, staff-only, guest-only)
│   │   │   ├── interceptors/   # attaches the JWT, handles 401s
│   │   │   ├── layout/          # shell, navbar, footer
│   │   │   ├── models/          # TS interfaces matching backend request/response shapes
│   │   │   ├── state/            # signal-based stores, one per feature area
│   │   │   └── utils/            # JWT decoding helper
│   │   ├── features/
│   │   │   ├── admin/            # admin shell + users/books/loans/cards management
│   │   │   ├── auth/              # login, register
│   │   │   ├── catalog/           # public book browsing/search
│   │   │   ├── home/               # landing page
│   │   │   ├── library-card/       # a patron's own card
│   │   │   └── profile/            # a patron's own account
│   │   ├── shared/
│   │   │   ├── ui/                  # reusable presentational components (modals, states, cards)
│   │   │   └── motion/               # shared animation helpers
│   │   ├── app.config.ts             # providers: router, HttpClient, interceptors
│   │   ├── app.routes.ts              # top-level route table
│   │   └── app.ts                     # root component (renders the shell)
│   └── environments/                   # apiBaseUrl per build configuration
├── tests/
│   ├── unit/            # store and utility tests (Jest + TestBed)
│   ├── integration/      # component tests (Jest + @testing-library/angular)
│   └── e2e/               # Playwright specs, run against a live dev server
├── jest.config.js
├── playwright.config.ts
└── angular.json
```

## Getting Started

### Prerequisites

- Node.js 18 or later
- A running instance of [`Server`](../../Server) (see its own `docs/README.md`), or at least a reachable API base URL

### Setup

```sh
cd Web
npm install
npm start          # ng serve, http://localhost:4200
```

There's no `.env` file for the frontend, the API base URL is compiled in per build configuration (see below), not read from the environment at runtime.

### Building

```sh
npm run build        # development configuration
npm run build:prod   # production configuration, output to dist/
```

## Environment Configuration

Angular's file-replacement mechanism swaps `src/environments/environment.ts` for `environment.production.ts` when building with `--configuration production` (wired up in `angular.json`, not something you pass at runtime).

| File | `apiBaseUrl` | Used for |
|---|---|---|
| `environment.ts` | `http://localhost:8000` | `ng serve`, dev builds, and since Jest doesn't apply the file-replacement step unit/integration tests too |
| `environment.production.ts` | `https://api.libraease.example.com` (placeholder) | `npm run build:prod` |

If you're deploying anywhere, update the placeholder in `environment.production.ts` before building it isn't read from an environment variable at build or run time.

## Architecture

Each feature area follows the same shape: a **component** (`.ts` + `.html` + `.css`, standalone) renders state pulled from a **store**, and the store calls an **API** service to talk to the backend. There's no separate "service" layer beyond the store itself, the store is both the state holder and the place business logic (retry, error messages, pagination bookkeeping) lives.

```
Component  →  Store (signals)  →  Api (HttpClient)  →  Server
   ↑              │
   └── reads state via signals, calls store methods on user actions
```

Stores are `@Injectable({ providedIn: 'root' })` singletons, so state persists across navigation within the same app session (e.g. the catalog keeps its filters and page if you navigate away and back). Every store exposes its state as read-only signals, writes only happen through the store's own methods (`loadPage`, `applyFilters`, `login`, and so on), never by mutating a signal from outside.

## Routing & Guards

Routes are defined in `src/app/app.routes.ts`, with admin sub-routes nested under `features/admin/admin.routes.ts`. Three functional guards live in `src/app/core/guards/auth-guard.ts`:

| Guard | Rule |
|---|---|
| `authGuard` | Requires a signed-in user (any role). Redirects to `/login` with a `returnUrl` query param if not |
| `staffGuard` | Requires a signed-in `ADMIN` or `EMPLOYEE`. Redirects to `/` otherwise |
| `guestGuard` | Requires the user to be signed **out**. Used on `/login` and `/register` so an already-authenticated user is redirected to `/` instead of seeing the form again |

`/admin` and everything under it is behind `staffGuard`; `/profile` and `/my-card` are behind `authGuard`; `/catalog` and `/` are public.

Guards check `AuthStore`, not the raw token, see [Authentication](#authentication) for how that state gets populated.

## State Management

State lives in signal-based stores under `src/app/core/state/`, one per feature area (`AuthStore`, `CatalogStore`, `AdminBooksStore`, `AdminUsersStore`, `AdminLoansStore`, `AdminCardsStore`, `MyLibraryCardStore`, `ProfileStore`, `SelfCheckoutStore`). The common pattern, visible in every store:

- A private writable `signal` holds the data; a public `computed` or `.asReadonly()` exposes it.
- `loading` and `errorMessage` signals track the in-flight request for whatever the store just triggered.
- Methods call the matching `Api` class, `tap` the success case into the signal, and `catchError` into `errorMessage`, extracting the backend's `{ message }` body rather than showing a raw HTTP error.

`AuthStore` is the one exception worth knowing about: alongside the in-memory signals, it persists the token and user object to `localStorage` (see [Authentication](#authentication)) and restores from there on construction, so a page refresh doesn't log the user out.

## API Layer

`src/app/core/api/` has one class per backend resource (`AuthApi`, `BookApi`, `LibraryCardApi`, `LoanApi`, `UserApi`), each a thin `HttpClient` wrapper: one method per endpoint, typed request/response models, no business logic. Every method's doc comment names the HTTP method and path it calls, so cross-referencing against the backend's own API reference is direct.

The base URL for every API class comes from `environment.apiBaseUrl`, there's no per-service override.

## Authentication

- On login, `AuthStore` stores the JWT and user object in both signals and `localStorage` (keys `libraease.token` / `libraease.user`), so the session survives a page reload.
- `authInterceptor` (a functional `HttpInterceptorFn`) reads the token off `AuthStore` and attaches `Authorization: Bearer <token>` to every outgoing request that has one available. It also globally handles 401 responses: on any 401, it logs the user out and redirects to `/login` with the current URL as `returnUrl`.
- `isJwtExpired` (`src/app/core/utils/jwt.util.ts`) decodes the token's payload client-side to check `exp`, this is a local sanity check only, not a substitute for server-side verification, which the backend still does on every request.
- Role checks in the UI (`isAdmin`, `isPatron`, `isStaff` computed signals on `AuthStore`) mirror the backend's role model (`ADMIN` / `EMPLOYEE` / `PATRON`) but are for UI gating only. The backend re-checks authorization on every request regardless of what the frontend shows or hides.

## Styling

Tailwind v4 utility classes, with the design system's actual palette and font stack defined once as CSS custom properties in `src/styles.css` under an `@theme` block `--color-forest-*` (primary/brand), `--color-coral-*` (accent/CTA), `--color-cream-*` (backgrounds), plus semantic `--color-success-*` / `--color-danger-*` ramps. New UI should pull colors from these tokens rather than introducing arbitrary hex values, so the palette stays consistent as features are added.

Reusable presentational pieces (modals, empty/error/loading states, the book card, the password-visibility toggle) live in `src/app/shared/ui/`, each as its own standalone component, independent of any single feature.

## Data Models

TypeScript interfaces in `src/app/core/models/` mirror the backend's request and response shapes, one file per resource (`auth.model.ts`, `book.model.ts`, `library-card.model.ts`, `loan.model.ts`, `user.model.ts`, `admin.model.ts`). A few things to know about how they're organized:

- Most files export the domain type itself (e.g. `BookModel`) alongside every request/response envelope that resource's API uses (`BookCreatePayload`, `BookQueryResponse`, and so on) so a single import from `book.model.ts` covers everything `BookApi` needs.
- `ApiErrorBody` (`auth.model.ts`) is the one type shared everywhere: `{ message: string; error?: string }`, matching the shape the backend sends on every 4xx/5xx response. Every store's `catchError` block reads `error.error as ApiErrorBody` to pull out the message shown to the user.
- `AuthUser` (used for the logged-in session) and `AdminUser` (used in admin list/management views) are two separate, near-identical interfaces rather than one shared type `AdminUser` adds `status`, which doesn't apply to the currently-logged-in user's own session data.

## Testing

Tests are centralized under `Web/tests/`, kept separate from `src/` entirely, there are no co-located `.spec.ts` files next to components.

```sh
npm test                  # unit + integration, with coverage (jest.config.js sets collectCoverage: true)
npm run test:unit          # tests/unit only
npm run test:integration    # tests/integration only
npm run test:coverage        # explicit coverage run
npm run e2e                   # Playwright, tests/e2e, starts its own dev server on :4200 if one isn't already running
npm run e2e:ui                 # Playwright UI mode, for debugging
```

- **Unit tests** (`tests/unit/`) target stores and utilities directly through Angular's `TestBed`, with API classes replaced by hand-written stubs (`{ provide: BookApi, useValue: { search: () => of(...) } }`) rather than a mocking library.
- **Integration tests** (`tests/integration/`) render feature components with `@testing-library/angular`'s `render()` and drive them with `@testing-library/user-event`, asserting against what's actually in the DOM rather than component internals. Stores are stubbed the same way as in unit tests.
- **E2E tests** (`tests/e2e/`) are Playwright specs that run against a real dev server and a real backend, covering full user flows (login, browsing the catalog, admin CRUD, route guards). These require a running `Server` instance, see the backend docs for the seed-admin credentials needed to exercise admin-only flows.

Jest is configured to run against `environment.ts` (the non-production environment file) in every case, since Angular's build-time file replacement doesn't apply to the Jest test runner.

## Known Quirks

- **The production `apiBaseUrl` is a placeholder.** `environment.production.ts` ships with `https://api.libraease.example.com`, which doesn't resolve to anything. Anyone cutting a production build needs to edit this file first, it isn't overridable via an environment variable at build time.
- **The session persists in `localStorage`, not a cookie.** This means the JWT is readable by any script running on the page (standard XSS exposure for `localStorage`-based auth), and `isJwtExpired`'s client-side decode is a UX nicety, not a security boundary, the backend still validates every token itself.
- **Client-side role checks (`isAdmin`/`isStaff`/`isPatron`) are for UI purposes only.** Hiding an admin button or route doesn't prevent a request from reaching the backend, the actual authorization always happens server-side, so this isn't a gap so much as a reminder not to treat frontend role checks as the source of truth.