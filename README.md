# Library Management API

Week 1 intern task: a layered CRUD REST API (Author, Book, Member, Loan) built with **NestJS + TypeORM + PostgreSQL**.

## Tech stack

- NestJS 11
- TypeORM + PostgreSQL
- class-validator / class-transformer
- Swagger (OpenAPI)
- Jest for testing

## Architecture

`Controller -> Service -> Repository`, entities are never returned directly — every response goes through a Response DTO (`@Exclude`/`@Expose` + `ClassSerializerInterceptor`) to avoid leaking internal columns and to prevent circular JSON when serializing bidirectional relations (e.g. `Author <-> Book`).

## Domain / tables

- **authors** (1) — (N) **books**
- **members** (1) — (N) **loans** (N) — (1) **books** (a `loans` join entity carries `borrowedAt` / `dueDate` / `returnedAt`)

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
   Tables are created automatically on boot (`synchronize: true`, dev-only setting).

## Run

```bash
# development (watch mode)
npm run start:dev

# production build
npm run build
npm run start:prod
```

The API listens on `PORT` from `.env` (default `3000`).

## API docs

Swagger UI: `http://localhost:<PORT>/api/docs`
Raw OpenAPI JSON (importable into Postman): `http://localhost:<PORT>/api/docs-json`

## Tests

```bash
npm run test        # unit tests
npm run test:cov    # coverage
```

## Endpoints

| Resource | Routes |
|---|---|
| Authors | `POST/GET /authors`, `GET/PUT/DELETE /authors/:id` |
| Books | `POST/GET /books` (pagination `page`, `limit`, sorting `sortBy`, `order`, filter `authorId`), `GET/PUT/DELETE /books/:id` |
| Members | `POST/GET /members`, `GET/PUT/DELETE /members/:id` |
| Loans | `POST/GET /loans`, `GET/PUT/DELETE /loans/:id`, `PATCH /loans/:id/return` (borrow/return flow, adjusts `Book.availableCopies`) |

All create endpoints return `201 Created`; missing resources return `404 Not Found`; validation failures return `400 Bad Request` with a centralized error shape (`src/common/filters/http-exception.filter.ts`).
