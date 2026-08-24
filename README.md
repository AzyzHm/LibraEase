<p align="center">
  <img src="Web/public/banner.jpg" alt="LibraEase banner" width="100%" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Angular-20-DD0031?logo=angular&logoColor=white" alt="Angular 20" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=white" alt="Node.js >=18" />
  <img src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white" alt="Express 4" />
  <img src="https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Jest-tested-C21325?logo=jest&logoColor=white" alt="Jest" />
  <img src="https://img.shields.io/badge/Playwright-e2e-2EAD33?logo=playwright&logoColor=white" alt="Playwright" />
  <img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="Apache 2.0 License" />
</p>

# LibraEase

LibraEase is a library management system: a public book catalog, self-checkout for patrons, and an admin/employee console for managing users, books, library cards, and loans. It's a two-package monorepo, an Angular client and an Express/Supabase API developed and tested together but deployed independently.

## Table of Contents

- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [Testing](#testing)
- [Continuous Integration](#continuous-integration)
- [Contributing](#contributing)
- [Security](#security)
- [Code of Conduct](#code-of-conduct)
- [License](#license)

## Project Structure

```
LibraEase/
├── Server/    # Express + TypeScript API, Supabase (Postgres)
│   └── README.md   # backend architecture, API reference, setup
├── Web/       # Angular 20 client (standalone components, Signals)
│   └── README.md   # frontend architecture, setup
└── .github/   # CI workflow, issue templates, dependabot config
```

Each package is self-contained: its own `package.json`, its own lint/test/build scripts, and its own documentation. This file covers the project as a whole; for anything specific to one side of the stack, see [Documentation](#documentation) below.

## Tech Stack

| Layer | Stack |
|---|---|
| **Frontend** | Angular 20 (standalone components, Signals), Tailwind CSS v4, RxJS |
| **Backend** | Express 4, TypeScript, Joi (validation), JSON Web Tokens |
| **Database** | Supabase (Postgres) |
| **Testing** | Jest (unit/integration, both packages), Playwright (frontend e2e), Supertest (backend e2e) |
| **Tooling** | ESLint (flat config) + Prettier, Husky/lint-staged, GitHub Actions CI, Dependabot |

## Getting Started

You'll need Node.js 18+ and a Supabase project (for the backend). Clone the repo, then set up each package:

```sh
git clone https://github.com/AzyzHm/LibraEase.git
cd LibraEase

# Backend
cd Server
npm install
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.
npm run dev             # http://localhost:8000

# Frontend, in a separate terminal
cd ../Web
npm install
npm start                # http://localhost:4200
```

On first run, the backend seeds an admin account if none exists yet and prints (or writes to a local file) the credentials you'll need to reach the admin console, see the backend docs for exact details. Full setup instructions, environment variables, and configuration options for each package live in their own docs, linked below.

## Documentation

| Package | Docs |
|---|---|
| Backend (`Server/`) | [`Server/README.md`](Server/README.md): architecture, environment variables, full API reference, data models, database schema, testing |
| Frontend (`Web/`) | [`Web/README.md`](Web/README.md): architecture, routing/guards, state management, API layer, auth flow, testing |

## Testing

Both packages keep tests centralized under their own `tests/{unit,integration,e2e}/` directories rather than co-located with source. Run each package's suite from within that package:

```sh
# Server
npm test               # unit + integration + e2e
npm run test:unit
npm run test:integration
npm run test:e2e

# Web
npm test               # unit + integration, with coverage
npm run test:unit
npm run test:integration
npm run e2e            # Playwright, requires a dev server
```

See each package's docs for what's covered at each test level.

## Continuous Integration

Every pull request runs through [`ci.yml`](.github/workflows/ci.yml): a `server` job (lint, typecheck, test), a `web` job (lint, typecheck, test), and a separate `web-e2e` job (Playwright across Chromium, Firefox, and WebKit) so a slow or flaky e2e run doesn't block fast feedback on the rest. Dependency updates are proposed automatically by [Dependabot](.github/dependabot.yml).

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow branching, code style, test expectations, and how to submit a pull request.

## Security

If you find a security vulnerability, **please don't open a public issue**. See [SECURITY.md](SECURITY.md) for how to report it privately.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you're expected to uphold it.

## License

LibraEase is licensed under the [Apache License 2.0](LICENSE).