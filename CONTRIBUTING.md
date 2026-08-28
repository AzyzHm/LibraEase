# Contributing to LibraEase

Thanks for taking the time to contribute. This document covers how to get set up, the conventions the codebase follows, and what to expect from the review process.

By participating in this project, you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

## Project Layout

LibraEase is a two-package monorepo:

- [`Server/`](Server) Express/TypeScript API backed by Supabase (Postgres). See [`Server/README.md`](Server/README.md) for architecture, API reference, and setup.
- [`Web/`](Web) Angular 20 client (standalone components, Signals). See [`Web/README.md`](Web/README.md) for architecture and setup.

Each package has its own `package.json`, lints and tests independently, and is documented separately, read the relevant `README.md` before making non-trivial changes to that package.

## Getting Started

1. Fork the repository and clone your fork.
2. Install dependencies in whichever package(s) you're changing:
   ```sh
   cd Server && npm install
   cd ../Web && npm install
   ```
3. Follow the **Getting Started** section in the relevant package's `README.md` to configure environment variables and run the dev server.
4. Create a branch off `main` for your change: `git checkout -b <type>/<short-description>` (e.g. `fix/loan-availability-check`, `feat/book-cover-upload`).

## Making Changes

- Keep pull requests focused. A PR that fixes a bug shouldn't also reformat unrelated files or bundle in an unrelated feature.
- Match the existing code style rather than introducing a new one, 2-space indentation, existing naming conventions (function-exported DAOs on the backend, signal-based stores on the frontend), and the patterns already used in neighboring files.
- If you're touching backend business logic (`Server/src/services/`) or a domain rule, check whether it changes anything documented in `Server/README.md` and update the doc alongside the code.
- If you find a pre-existing bug while working on something else, prefer flagging it (in the PR description or a new issue) over silently fixing it as a drive-by change, unless it's directly blocking your PR.

### Commit Messages

Write commit messages that explain *why*, not just *what*, when the reason isn't obvious from the diff. Conventional prefixes (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`) are appreciated but not strictly enforced.

## Testing

Every change that touches application behavior needs test coverage unit and/or integration, matching what the change affects. Both packages separate test types the same way:

**Server** (`Server/`):
```sh
npm run test:unit         # tests/unit
npm run test:integration  # tests/integration (HTTP-level, via supertest)
npm run test:e2e          # tests/e2e, no test files yet, no-ops for now
npm test                  # everything
```

**Web** (`Web/`):
```sh
npm run test:unit         # tests/unit
npm run test:integration  # tests/integration (component tests via @testing-library/angular)
npm run e2e               # tests/e2e (Playwright, requires a running dev server)
npm test                  # unit + integration, with coverage
```

New tests go in the centralized `tests/{unit,integration,e2e}/` directory of the relevant package, not co-located next to source files. Before opening a PR, run the full test suite, lint, and typecheck for any package you touched:

```sh
npm test && npm run lint && npm run typecheck   # Server
npm test && npm run lint && npm run typecheck   # Web
```

All of this also runs in CI (`.github/workflows/ci.yml`) on every pull request; a PR won't be merged with a red build.

## Code Style

Both packages use ESLint (flat config) and Prettier, enforced via Husky/lint-staged on commit. If your editor doesn't already format on save:

```sh
npm run lint:fix
npm run format
```

## Submitting a Pull Request

1. Push your branch and open a PR against `main`.
2. Fill in what the PR does and why, and link any related issue.
3. Make sure CI is green (lint, typecheck, unit/integration tests, and e2e for `Web`).
4. Be responsive to review feedback. Small, incremental commits in response to review are easier to follow than force-pushed rewrites, but either is fine as long as the final diff is clean.

## Reporting Bugs and Requesting Features

Use the [issue tracker](../../issues) templates are provided for bug reports and feature requests. **Do not** open a public issue for a security vulnerability; see [SECURITY.md](SECURITY.md) instead.

## Questions

If something in this guide or the package docs is unclear, open a discussion or issue rather than guessing, it's likely the docs need clarifying for the next person too.