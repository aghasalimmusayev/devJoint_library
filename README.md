# Library Management API

A layered CRUD REST API (Author, Book, User, Loan) built with **NestJS + TypeORM + PostgreSQL**.

- **Week 1**: CRUD for Authors, Books, Members, Loans.
- **Week 2**: JWT authentication, role-based access control (USER/ADMIN), and Members were merged into the `User` model — borrowing a book only requires being a registered user.

## Tech stack

- NestJS 11
- TypeORM + PostgreSQL
- @nestjs/config
- @nestjs/jwt + @nestjs/passport + passport-jwt (JWT authentication)
- bcrypt (password hashing)
- class-validator / class-transformer
- Swagger (OpenAPI)
- Jest for testing

## Architecture

`Controller -> Service -> Repository`, entities are never returned directly — every response goes through a Response DTO (`@Exclude`/`@Expose` + a global `ClassSerializerInterceptor`) to avoid leaking internal columns (e.g. FK ids, password hashes) and to prevent circular JSON when serializing bidirectional relations (e.g. `Author <-> Book`).

All entities extend a shared `BaseEntity` (`src/common/entities/base.entity.ts`) that provides `id` (uuid), `createdAt`, `updatedAt`.

Authentication/authorization is enforced by two global guards (`src/auth/auth.module.ts`), applied in this order:
1. **`JwtAuthGuard`** (`src/common/guards/jwt-auth.guard.ts`) — validates the JWT (via `JwtStrategy`, stateless — no server-side session). Routes marked `@Public()` skip this check. Failure (missing/invalid/expired token) → `401`.
2. **`RolesGuard`** (`src/common/guards/roles.guard.ts`) — checks `@Roles(...)` metadata against the authenticated user's role. No metadata → any authenticated user is allowed. Failure → `403`.

## Domain

- **Author** (1) — (N) **Book**
- **User** (1) — (N) **Loan** (N) — (1) **Book** — `Loan` is a standalone entity (not a plain many-to-many) so it can carry `dueDate` / `returnedAt`. Borrowing a book requires nothing more than being a registered `User` — there is no separate "membership" step.

## Business rules

- Borrowing a book (`POST /loans`) requires `Book.availableCopies > 0`; it decrements the count and fails with `400` otherwise. The loan is always created for the requester's own account (`userId` comes from the JWT, not the request body).
- `dueDate` (on create and on update) must be a future date — validated in `LoansService`.
- Returning a book (`PATCH /loans/:id/return`) sets `returnedAt` and increments `Book.availableCopies`; returning an already-returned loan fails with `400`.

## Authentication & Authorization

- `POST /auth/register` and `POST /auth/login` are public and return a JWT (`accessToken`) plus the user profile. Passwords are hashed with bcrypt; the JWT secret and expiry come from `.env` (`JWT_SECRET`, `JWT_EXPIRES_IN`), never hardcoded.
- Send the token on every other request: `Authorization: Bearer <accessToken>`.
- Two roles exist: `user` (default, assigned on registration) and `admin`. There is no self-service way to become `admin` — see **Creating the first admin** below.
- **401 vs 403**: a missing/invalid/expired token → `401 Unauthorized`. A valid token but insufficient role, or acting on someone else's resource → `403 Forbidden`.

### Who can do what

| Resource | Endpoint | Access |
|---|---|---|
| Authors / Books | `GET` (list/one) | Public — no token needed |
| Authors / Books | `POST` / `PATCH` / `DELETE` | `ADMIN` only |
| Loans | `POST` (borrow) | Any authenticated user — always for their own account |
| Loans | `GET` (list/one) | `USER` sees only their own loans, `ADMIN` sees all |
| Loans | `PATCH` / `PATCH .../return` / `DELETE` | `ADMIN` only |
| Users | `GET` (list/one) | `ADMIN` only |
| Users | `PATCH` / `DELETE` | Any user, **only on their own account** (no admin override) |
| Auth | `register` / `login` | Public |

### Creating the first admin

Since `register` always creates a `USER`, seed one admin account directly:

```bash
npm run seed:admin
```

This reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` and creates an admin user (skips if that email already exists). Once one admin exists, it can be used to log in and manage the system through the `ADMIN`-only endpoints above.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your local values:
   ```bash
   cp .env.example .env
   ```
   ```
   PORT=4014
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=
   DB_NAME=library_db
   NODE_ENV=development
   JWT_SECRET=          # any long random string
   JWT_EXPIRES_IN=15m
   ADMIN_EMAIL=
   ADMIN_PASSWORD=
   ```
3. Make sure the database in `DB_NAME` exists (create it if needed):
   ```sql
   CREATE DATABASE library_db;
   ```
   Tables are created automatically on boot (`synchronize: true` while `NODE_ENV !== 'production'`).
4. Seed the first admin account (see above):
   ```bash
   npm run seed:admin
   ```

## Run

```bash
# development (watch mode)
npm run dev

# without watch
npm run start

# production build
npm run build
npm run start:prod
```

The API listens on `PORT` from `.env` (default `4014` if unset).

## API docs

- Swagger UI: `http://localhost:<PORT>/api/docs` — click **Authorize** and paste a JWT (`accessToken` from `/auth/login`) to call protected endpoints directly from the UI.
- Raw OpenAPI JSON (importable into Postman): `http://localhost:<PORT>/api/docs-json`

## Tests

```bash
npm run test        # unit tests
npm run test:cov    # coverage
```

## Endpoints

| Resource | Routes |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login` — public, return a JWT |
| Authors | `POST/GET /authors`, `GET/PATCH/DELETE /authors/:id` (GET is public, writes are ADMIN-only) |
| Books | `POST/GET /books` (pagination `page`, `limit`, sorting `sortBy`, `order`, filter `authorId`), `GET/PATCH/DELETE /books/:id` (GET is public, writes are ADMIN-only) |
| Loans | `POST/GET /loans`, `GET/PATCH/DELETE /loans/:id`, `PATCH /loans/:id/return` (borrow/return flow, adjusts `Book.availableCopies`) |
| Users | `GET /users`, `GET/PATCH/DELETE /users/:id` |

## Response conventions

- Create → `201 Created`
- Read / update / delete on an existing resource → `200 OK`
- Missing resource → `404 Not Found`
- Validation / business-rule failures → `400 Bad Request`
- Not authenticated (missing/invalid/expired token) → `401 Unauthorized`
- Authenticated but not allowed (wrong role, or someone else's resource) → `403 Forbidden`
- Delete endpoints return a body: `{ "message": "The <resource> has been removed" }`
- All errors go through a centralized filter (`src/common/filters/http-exception.filter.ts`) and share one JSON shape: `{ statusCode, timestamp, path, message }`
