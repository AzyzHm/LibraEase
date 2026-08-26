# LibraEase Backend

API server for LibraEase, a library management system. Handles user accounts, book records, library cards, and loans, and stores everything in Supabase (Postgres).

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Architecture](#architecture)
- [Authentication & Authorization](#authentication--authorization)
- [Rate Limiting](#rate-limiting)
- [API Reference](#api-reference)
  - [Health](#health)
  - [Auth](#auth)
  - [Users](#users)
  - [Books](#books)
  - [Library Cards](#library-cards)
  - [Loan Records](#loan-records)
- [Data Models](#data-models)
- [Database Schema](#database-schema)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Scripts](#scripts)
- [Known Quirks](#known-quirks)

## Tech Stack

- **Runtime**: Node.js (>=18), TypeScript
- **Framework**: Express 4
- **Database**: Supabase (Postgres), accessed through `@supabase/supabase-js`
- **Validation**: Joi
- **Auth**: JSON Web Tokens (`jsonwebtoken`), passwords hashed with `bcryptjs`
- **Testing**: Jest (unit, integration, and an internal e2e project) with `supertest` and `ts-jest`
- **Linting/formatting**: ESLint (flat config) + Prettier, enforced on commit via Husky/lint-staged

## Project Structure

```
Server/
├── src/
│   ├── config/         # env parsing, Supabase client singleton
│   ├── controllers/     # request/response handling, HTTP status mapping
│   ├── daos/             # Supabase queries, row <-> model mapping
│   ├── middlewares/      # auth, validation, rate limiting
│   ├── models/           # plain TS interfaces (IUser, IBook, ...)
│   ├── routes/           # route definitions per resource
│   ├── services/         # business logic between controllers and DAOs
│   ├── startup/           # one-time startup tasks (admin seeding)
│   ├── utils/             # custom errors, JWT helpers, error-shape helpers
│   ├── app.ts             # Express app factory
│   └── server.ts          # entry point
├── scripts/
│   └── import-books.ts    # bulk-loads Server/books.json into Supabase
├── supabase/
│   └── schema.sql          # table definitions, indexes, migration notes
├── tests/
│   ├── unit/
│   ├── integration/
│   └── setup/
└── .env.example
```

## Getting Started

### Prerequisites

- Node.js 18 or later
- A Supabase project with the schema in [`supabase/schema.sql`](../supabase/schema.sql) applied

### Setup

```sh
cd Server
npm install
cp .env.example .env   # then fill in the values, see below
npm run dev
```

`npm run dev` runs the server with `tsx watch` against `src/server.ts`, so it restarts on file changes. For a production-style run, `npm start` builds to `dist/` first (via the `prestart` script) and runs the compiled output.

On startup, the server checks whether any `ADMIN` user exists in the database. If not, it creates one from the `SEED_ADMIN_*` environment variables (see below) and logs the credentials. If you didn't set `SEED_ADMIN_PASSWORD`, a random password is generated and written to `.seed-admin-credentials.txt` in the `Server/` directory, read it, log in, then delete the file.

## Environment Variables

All variables are read via `dotenv` in [`src/config/index.ts`](../src/config/index.ts) (JWT expiry and the seed-admin values are read directly from `process.env` elsewhere, see [Known Quirks](#known-quirks)).

| Variable | Required | Default | Notes |
|---|---|---|---|
| `SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Service role key; the client is created with `persistSession: false` |
| `JWT_SECRET` | Recommended | a hardcoded string in source | Always set this outside local development, see [Known Quirks](#known-quirks) |
| `JWT_EXPIRES_IN` | No | `7d` | Any value accepted by `jsonwebtoken`'s `expiresIn` |
| `PORT` | No | `8000` | HTTP port |
| `ROUNDS` | No | random 1–10 | bcrypt cost factor, see [Known Quirks](#known-quirks) |
| `SEED_ADMIN_EMAIL` | No | `admin@libraease.local` | Used only when no admin exists yet |
| `SEED_ADMIN_PASSWORD` | No | randomly generated | Set this to pin a known admin password |
| `SEED_ADMIN_FIRSTNAME` | No | `Library` | |
| `SEED_ADMIN_LASTNAME` | No | `Admin` | |

## Architecture

Requests flow through four layers:

1. **Routes** (`src/routes/`) wire an HTTP method + path to `authenticate`/`authorize`/`ValidateSchema` middleware and a controller function.
2. **Controllers** (`src/controllers/`) pull data off `req`, call a service, and shape the JSON response and status code. This is also where response sanitization happens (stripping `password` before a user or library card goes back to the client).
3. **Services** (`src/services/`) business rules: existence checks, password hashing, availability checks for loans, pagination math. Services throw the custom errors in `src/utils/LibraryErrors.ts` when something domain-specific goes wrong (a book that doesn't exist, a role transition that isn't allowed, and so on).
4. **DAOs** (`src/daos/`) the only layer that talks to Supabase. Each DAO exports plain functions (no classes) and converts between the app's camelCase fields and the database's snake_case columns where the two differ (`publicationDate` ↔ `publication_date`, `loanedDate` ↔ `loaned_date`, etc.).

The Supabase client itself is a singleton created once in `src/config/supabaseClient.ts`, alongside an `unwrap()` helper that throws on any Postgrest error and otherwise returns `data` directly, so DAOs don't have to repeat `{ data, error }` destructuring.

## Authentication & Authorization

Auth is stateless JWT-based:

- `POST /auth/login` returns a signed token containing `{ id, type, email }`.
- Protected routes use the `authenticate` middleware, which reads the `Authorization: Bearer <token>` header, verifies it against `JWT_SECRET`, and attaches the payload to `req.user`.
- Role-gated routes additionally use `authorize('ADMIN', 'EMPLOYEE', ...)`, which checks `req.user.type` against the allowed list.

There are three roles: `ADMIN`, `EMPLOYEE`, and `PATRON`. Every new registration is created as a `PATRON` with `status: 'PENDING'`. An admin has to approve the account (`PUT /users/:userId/approve`) before that user can log in, logging in while `PENDING` or `REJECTED` returns a 403.

Beyond the role check in `authorize`, several controllers apply a second, per-resource check, for example, a patron can fetch their own library card or user record but not someone else's, even though the route itself only requires "authenticated." Look at the controller, not just the route, to see the full access rule for a given endpoint.

## Rate Limiting

Two `express-rate-limit` instances, both keyed on IP:

- **`apiLimiter`** applied globally in `src/app.ts`, 300 requests per 15 minutes.
- **`authLimiter`** applied only to `POST /auth/register` and `POST /auth/login`, 10 requests per 15 minutes.

Both send `RateLimit-*` standard headers and a JSON `{ message }` body on the 429 response.

## API Reference

Unless noted otherwise, request and response bodies are JSON. Routes marked **Auth** require a valid Bearer token; **Roles** lists which `type` values `authorize` accepts for that route (no list means any authenticated user).

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Liveness check, returns `{ message: 'Server is running' }` |

### Auth

Rate-limited by `authLimiter`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Creates a `PATRON` account with `status: PENDING`. Body validated against `Schemas.user.create` |
| POST | `/auth/login` | No | Returns a JWT on success. 403 if the account is `PENDING`/`REJECTED`, 401 on bad credentials |

### Users

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/users` | Yes | ADMIN, EMPLOYEE | Lists users. Employees only see `PATRON`s; admins see everyone except other admins |
| GET | `/users/pending` | Yes | ADMIN | Lists users with `status: PENDING` |
| GET | `/users/:userId` | Yes | — | Admin/employee can view anyone; a patron can only view their own record |
| DELETE | `/users/:userId` | Yes | — | Admin can delete anyone; a non-admin can only delete their own account |
| PUT | `/users` | Yes | — | Updates the caller's own profile. Non-admins can't change their own `type`, the controller silently restores the existing value if they try |
| PUT | `/users/:userId/approve` | Yes | ADMIN | Sets `status: APPROVED` |
| PUT | `/users/:userId/reject` | Yes | ADMIN | Sets `status: REJECTED` |
| PUT | `/users/:userId/promote` | Yes | ADMIN | `PATRON` → `EMPLOYEE`. 409 if already an employee or if the target is an admin |
| PUT | `/users/:userId/demote` | Yes | ADMIN | `EMPLOYEE` → `PATRON`. 409 if already a patron or if the target is an admin |

All user responses strip the `password` field before returning.

### Books

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/book` | No | — | Returns every book (no pagination) |
| GET | `/book/query` | No | — | Paginated search. Query params: `page`, `limit` (defaults 1/25), plus optional `title`, `barcode`, `description`, `genre` (substring match) and `author`, `subject` (exact match against the array column) |
| POST | `/book` | Yes | ADMIN, EMPLOYEE | Creates a book. Body validated against `Schemas.book.create` |
| PUT | `/book` | Yes | ADMIN, EMPLOYEE | Updates a book by `barcode` in the body. 404 if no book has that barcode |
| DELETE | `/book/:barcode` | Yes | ADMIN, EMPLOYEE | Deletes a book by barcode. 404 if it doesn't exist |

`barcode` is validated as an ISBN-10 or ISBN-13 (dashes allowed and stripped before checking).

### Library Cards

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/card` | Yes | ADMIN, EMPLOYEE | Lists all library cards, each with its owner's user record attached |
| GET | `/card/me` | Yes | — | Returns the caller's own card, 404 if they don't have one |
| GET | `/card/:cardId` | Yes | — | Admin/employee can view any card; a patron can only view their own |
| POST | `/card` | Yes | — | Issues a card for the `user` id in the body. Admin/employee can issue for anyone; a patron can only request their own. 400 if the target user is an `ADMIN`. If a card already exists for that user, the existing card is returned instead of erroring |

Card responses embed `userDetails` (the owner's user record, minus `password`) rather than a bare `user` id.

### Loan Records

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/loan` | Yes | ADMIN, EMPLOYEE | Lists all loan records |
| POST | `/loan` | Yes | ADMIN, EMPLOYEE | Creates a loan record directly (staff-driven checkout/checkin flow) |
| PUT | `/loan` | Yes | ADMIN, EMPLOYEE | Updates a loan record by `id` in the body |
| POST | `/loan/query` | Yes | — | Looks up records by a single `{ property, value }` pair. A patron can only query `property: 'patron'` with their own id, anything else returns 403 |
| POST | `/loan/self` | Yes | PATRON | Self-checkout: body is `{ item, dueDate }`. 409 if the item is currently loaned out and not yet returned |
| GET | `/loan/availability/:itemId` | Yes | — | Returns `{ available: boolean }` for a given book id |

## Data Models

Defined in `src/models/`. DAOs extend each with an `id` (see `src/daos/*.ts`).

```ts
interface IUser {
  type: 'ADMIN' | 'EMPLOYEE' | 'PATRON';
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface IBook {
  barcode: string;
  cover: string;
  title: string;
  authors: string[];
  description: string;
  subjects: string[];
  publicationDate: Date;
  publisher: string;
  pages: number;
  genre: string;
}

interface ILibraryCard {
  user: string; // user id
}

interface ILoanRecord {
  status: 'AVAILABLE' | 'LOANED';
  loanedDate: Date;
  dueDate: Date;
  returnedDate?: Date | null;
  patron: string;      // user id
  employeeOut?: string | null; // user id of staff who checked it out
  employeeIn?: string | null;  // user id of staff who checked it in
  item: string;         // book id
}

interface IPagination<T> {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  limit: number;
  pageCount: number;
  items: T[];
}
```

## Database Schema

Applied via [`supabase/schema.sql`](../supabase/schema.sql), which creates four tables:

- **`users`** : `id`, `type`, `firstname`, `lastname`, `email` (unique), `password` (hashed), `status` (defaults to `PENDING`)
- **`books`** : `id`, `barcode` (unique), `cover`, `title` (unique), `authors` (`text[]`), `description`, `subjects` (`text[]`), `publication_date`, `publisher`, `pages`, `genre`
- **`library_cards`** : `id`, `user_id` (unique, references `users`, cascades on delete)
- **`loan_records`** : `id`, `status`, `loaned_date`, `due_date`, `returned_date`, `patron`/`employee_out`/`employee_in` (references `users`), `item` (references `books`), `created_at`, `updated_at`

GIN indexes cover the `authors` and `subjects` array columns; b-tree indexes cover `books.barcode`, `books.title`, `books.genre`, and both foreign key columns on `loan_records`.

Two things worth knowing if you're setting up a fresh database:

- There's no admin yet on a brand-new database, so the first registered user has to be approved manually with a SQL `update`, see the comment at the bottom of `schema.sql` or you can just let the app's own admin-seeding step (see [Getting Started](#getting-started)) create one on first run.
- A migration note in the schema file documents that `loan_records.employee_out` had to be made nullable to support self-checkout, where there's no staff member involved. If your Supabase project predates that change, you'll need to run the `alter table` statement at the bottom of the file once.

## Error Handling

Domain errors are plain `Error` subclasses in `src/utils/LibraryErrors.ts` (`UserDoesNotExistError`, `BookDoesNotExistError`, `AccountPendingApprovalError`, `InvalidRoleTransitionError`, `BookAlreadyLoanedError`, and so on). Services throw these; controllers catch them with `instanceof` checks and map each to a status code, a `DoesNotExistError` becomes 404, `BookAlreadyLoanedError` becomes 409, and anything uncaught falls through to 500.

Two helpers in `src/utils/errors.ts` normalize errors that didn't originate as one of the classes above: `getErrorMessage` safely extracts a string from an `unknown` catch value, and `getErrorCode` pulls a Postgres error code (like `23505` for a unique-constraint violation) off a Supabase error so services can react to specific database failures without depending on Supabase's types directly.

Request validation failures (Joi) are handled separately, in the `ValidateSchema` middleware, and always return 422 with a generic message rather than the specific Joi error so if a request is being rejected unexpectedly, check the relevant schema in `src/middlewares/Validation.ts` rather than the response body.

## Testing

Tests live under `Server/tests/`, split into three Jest projects defined in `jest.config.js`:

```sh
npm test               # everything, in band
npm run test:unit       # tests/unit only
npm run test:integration # tests/integration only
npm run test:e2e         # tests/e2e only (HTTP-level, via supertest — separate from the Playwright e2e suite in Web/)
npm run test:cov          # full run with coverage
```

All three projects load `tests/setup/env.setup.ts` first, which fills in placeholder env vars (`test-jwt-secret`, a fake Supabase URL, `SERVER_ROUNDS=4`, etc.) so tests don't need a real `.env` file or a live Supabase project.

## Scripts

- **`npm run import:books`** : runs `scripts/import-books.ts`, which reads `Server/books.json` and inserts it into the `books` table in chunks of 500. Requires `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` to be set, since it talks to Supabase directly rather than through the app.