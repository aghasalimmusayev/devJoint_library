# Library Management API

A layered CRUD REST API (Author, Book, Category, User, Loan) built with **NestJS + TypeORM + PostgreSQL**.

- **Week 1**: CRUD for Authors, Books, Members, Loans.
- **Week 2**: JWT authentication, role-based access control (USER/ADMIN), and Members were merged into the `User` model — borrowing a book only requires being a registered user.
- **Week 3**: `Book <-> Category` many-to-many; dynamic/complex filtering on `Books` and `Loans` list endpoints; `@Transactional()` on the two loan operations that write to more than one table; N+1-safe query design (join for to-one relations, batch-load for to-many).

## Tech stack

- NestJS 11
- TypeORM + PostgreSQL
- @nestjs/config
- @nestjs/jwt + @nestjs/passport + passport-jwt (JWT authentication)
- typeorm-transactional (`@Transactional()` decorator over TypeORM's `DataSource`)
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
- **Book** (N) — (N) **Category** — a genuine many-to-many, owned by `Book` via a `book_categories` join table (`@JoinTable`). `Category.name` is unique (case-insensitive).

## Business rules

- Borrowing a book (`POST /loans`) requires `Book.availableCopies > 0`; it decrements the count and fails with `400` otherwise. The loan is always created for the requester's own account (`userId` comes from the JWT, not the request body).
- `dueDate` (on create and on update) must be a future date — validated in `LoansService`.
- Returning a book (`PATCH /loans/:id/return`) sets `returnedAt` and increments `Book.availableCopies`; returning an already-returned loan fails with `400`.
- Creating/updating a `Book` with `categoryIds` validates that every id exists in one query (`CategoriesService.findByIds`) — an unknown id fails the whole request with `404`, nothing is saved.
- Creating/renaming a `Category` rejects a case-insensitive duplicate `name` with `409 Conflict` instead of a raw DB constraint error.

## Transactions

`LoansService.create()` and `LoansService.returnBook()` each write to two tables (`Book` + `Loan`) and are wrapped in `@Transactional()` (from `typeorm-transactional`) so both writes commit or roll back together — a failure between the two never leaves a decremented/incremented copy count with no matching loan change. Wiring: `initializeTransactionalContext()` in `main.ts`, `addTransactionalDataSource()` in `app.module.ts`'s `TypeOrmModule.forRootAsync`.

## N+1 query safety

List endpoints that touch a to-many relation are deliberately built to avoid the classic N+1 pattern (1 query for the list + N queries for each row's relation):
- `BooksService.findAll()` joins `author` (many-to-one, safe with `skip`/`take`) directly, but batch-loads `categories` for the whole page in one extra `WHERE book.id IN (...)` query instead of joining it into the paginated query — a to-many join there would multiply rows and break pagination.
- `LoansService.findAll()` joins `book`, `book.author` and `user` directly since all are many-to-one — no row multiplication risk.

## Dynamic filtering

`GET /books` and `GET /loans` build their `WHERE` clause dynamically from a `TypeOrmQueryBuilder` — each query param is optional and only added to the query if present (the TypeORM equivalent of a Specification-style dynamic query):

- **Books** (`BookQueryDto`): `authorId`, `categoryId` (inner-joined, safe with pagination since it's filtered to a single id), `search` (case-insensitive `ILIKE` on `title`), `publishedFrom` / `publishedTo` (date range), `availableOnly` (`availableCopies > 0`).
- **Loans** (`LoanQueryDto`): `bookId`, `userId` (ADMIN only — a `USER` is always scoped to their own loans regardless), `dueDateFrom` / `dueDateTo`, `status` (`active` / `returned` / `overdue` — `overdue` is a derived condition: `returnedAt IS NULL AND dueDate < now`).

Both endpoints return `{ data, total, page, limit }`.

## Authentication & Authorization

- `POST /auth/register` and `POST /auth/login` are public and return a JWT (`accessToken`) plus the user profile. Passwords are hashed with bcrypt; the JWT secret and expiry come from `.env` (`JWT_SECRET`, `JWT_EXPIRES_IN`), never hardcoded.
- Send the token on every other request: `Authorization: Bearer <accessToken>`.
- Two roles exist: `user` (default, assigned on registration) and `admin`. There is no self-service way to become `admin` — see **Creating the first admin** below.
- **401 vs 403**: a missing/invalid/expired token → `401 Unauthorized`. A valid token but insufficient role, or acting on someone else's resource → `403 Forbidden`.

### Who can do what

| Resource | Endpoint | Access |
|---|---|---|
| Authors / Books / Categories | `GET` (list/one) | Public — no token needed |
| Authors / Books / Categories | `POST` / `PATCH` / `DELETE` | `ADMIN` only |
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
| Categories | `POST/GET /categories`, `GET/PATCH/DELETE /categories/:id` (GET is public, writes are ADMIN-only, duplicate `name` → `409`) |
| Books | `POST/GET /books` (pagination `page`/`limit`/`sortBy`/`order`, filters `authorId`/`categoryId`/`search`/`publishedFrom`/`publishedTo`/`availableOnly`), `GET/PATCH/DELETE /books/:id` (GET is public, writes are ADMIN-only; create/update accept `categoryIds`) |
| Loans | `POST/GET /loans` (pagination + filters `bookId`/`userId`/`dueDateFrom`/`dueDateTo`/`status`), `GET/PATCH/DELETE /loans/:id`, `PATCH /loans/:id/return` (borrow/return flow, adjusts `Book.availableCopies` atomically inside a transaction) |
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
