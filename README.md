# Library Management API

Week 1 intern task: a layered CRUD REST API (Author, Book, Member, Loan) built with **NestJS + TypeORM + PostgreSQL**.

## Tech stack

- NestJS 11
- TypeORM + PostgreSQL
- @nestjs/config
- class-validator / class-transformer
- Swagger (OpenAPI)
- Jest for testing

## Architecture

`Controller -> Service -> Repository`, entities are never returned directly — every response goes through a Response DTO (`@Exclude`/`@Expose` + a global `ClassSerializerInterceptor`) to avoid leaking internal columns (e.g. FK ids) and to prevent circular JSON when serializing bidirectional relations (e.g. `Author <-> Book`).

All entities extend a shared `BaseEntity` (`src/common/entities/base.entity.ts`) that provides `id` (uuid), `createdAt`, `updatedAt`.

## Domain

- **Author** (1) — (N) **Book**
- **Member** (1) — (N) **Loan** (N) — (1) **Book** — `Loan` is a standalone entity (not a plain many-to-many) so it can carry `borrowedAt` / `dueDate` / `returnedAt`

## Business rules

- Borrowing a book (`POST /loans`) requires `Book.availableCopies > 0`; it decrements the count and fails with `400` otherwise.
- `dueDate` (on create and on update) must be a future date — validated in `LoansService`.
- Returning a book (`PATCH /loans/:id/return`) sets `returnedAt` and increments `Book.availableCopies`; returning an already-returned loan fails with `400`.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your local PostgreSQL credentials:
   ```bash
   cp .env.example .env
   ```
3. Make sure the database in `DB_NAME` exists (create it if needed):
   ```sql
   CREATE DATABASE library_db;
   ```
   Tables are created automatically on boot (`synchronize: true` while `NODE_ENV !== 'production'`).

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

The API listens on `PORT` from `.env` (default `3000` if unset).

## API docs

- Swagger UI: `http://localhost:<PORT>/api/docs`
- Raw OpenAPI JSON (importable into Postman): `http://localhost:<PORT>/api/docs-json`

## Tests

```bash
npm run test        # unit tests
npm run test:cov    # coverage
```

## Endpoints

| Resource | Routes |
|---|---|
| Authors | `POST/GET /authors`, `GET/PATCH/DELETE /authors/:id` |
| Books | `POST/GET /books` (pagination `page`, `limit`, sorting `sortBy`, `order`, filter `authorId`), `GET/PATCH/DELETE /books/:id` |
| Members | `POST/GET /members`, `GET/PATCH/DELETE /members/:id` |
| Loans | `POST/GET /loans`, `GET/PATCH/DELETE /loans/:id`, `PATCH /loans/:id/return` (borrow/return flow, adjusts `Book.availableCopies`) |

## Response conventions

- Create → `201 Created`
- Read / update / delete on an existing resource → `200 OK`
- Missing resource → `404 Not Found`
- Validation / business-rule failures → `400 Bad Request`
- Delete endpoints return a body: `{ "message": "The <resource> has been removed" }`
- All errors go through a centralized filter (`src/common/filters/http-exception.filter.ts`) and share one JSON shape: `{ statusCode, timestamp, path, message }`
