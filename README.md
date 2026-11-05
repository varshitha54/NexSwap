# NexSwap — Campus Book Exchange Platform

NexSwap is a full-stack campus marketplace where students can list, sell, and exchange
textbooks with one another. It includes JWT authentication, an image-backed catalogue,
search and filtering, exchange workflows, dashboards, and an administrator area.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite, React Router, Axios, hand-written CSS, Lucide icons |
| Backend | Java 17, Spring Boot 3, Spring Security, Spring Data JPA, Maven |
| Auth | JWT (HS256), BCrypt password hashing, role-based access |
| Database | MySQL 8 |
| Storage | Local filesystem for book cover uploads |

## Project layout

```
NexSwap1/
├── backend/
│   ├── src/main/java/com/nexswap/
│   │   ├── config/        Security, JWT, CORS, uploads and bootstrap config
│   │   ├── controller/    REST controllers
│   │   ├── dto/           Request/response records and validation
│   │   ├── entity/        JPA entities and enums
│   │   ├── exception/     Centralised API exception handling
│   │   ├── repository/    Spring Data repositories and specifications
│   │   └── service/       Business logic
│   ├── src/main/resources/application.yml
│   ├── src/test/          Integration tests (H2 profile)
│   └── pom.xml
├── frontend/
│   ├── src/components/    Reusable UI
│   ├── src/context/       Auth and toast providers
│   ├── src/pages/         Route-level pages
│   ├── src/styles/        Design system and page styles
│   └── vite.config.js
├── database/schema.sql    Reference MySQL schema
├── docker-compose.yml     Optional local MySQL service
└── .env.example           Environment variable template
```

## Prerequisites

- Java 17 or newer (`java -version`)
- Node.js 20 or newer (`node --version`)
- MySQL 8 (local service or Docker)
- Maven 3.9 is not required: the Maven wrapper is included at `backend/mvnw`.

## 1. Configure environment variables

Copy the template and replace every placeholder. Generate a strong JWT secret, for
example with `openssl rand -base64 48`.

```bash
cp .env.example backend/.env
cp frontend/.env.example frontend/.env
```

The backend reads the variables as standard environment variables. Export them before
starting Spring Boot. A convenient shell command is:

```bash
cd backend
set -a
source .env
set +a
```

The frontend only uses `VITE_API_URL` (and optionally `VITE_MEDIA_URL`) from
`frontend/.env`.

> No database password or JWT signing key is stored in source control. Both are required
> from the environment. The backend intentionally refuses to start without `DB_PASSWORD`
> and `JWT_SECRET`.

## 2. Create the MySQL database

### Option A — an existing MySQL server

Sign in as an administrator and run:

```sql
CREATE DATABASE nexswap CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nexswap'@'localhost' IDENTIFIED BY 'your-strong-password';
GRANT ALL PRIVILEGES ON nexswap.* TO 'nexswap'@'localhost';
FLUSH PRIVILEGES;
```

Then set `DB_USERNAME=nexswap` and `DB_PASSWORD=your-strong-password` in `backend/.env`.
Tables are created automatically by Hibernate on first start. The equivalent reference
DDL is in [`database/schema.sql`](database/schema.sql).

### Option B — Docker

```bash
# Export DB_PASSWORD first (the compose file will not start without it)
export DB_PASSWORD='your-strong-password'
docker compose up -d mysql
```

## 3. Run the backend

```bash
cd backend
set -a && source .env && set +a
./mvnw spring-boot:run
```

The API starts at `http://localhost:8080`. Uploaded images are served from
`http://localhost:8080/uploads/...`.

Optional bootstrap administrator: set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before the
first start. A student account can also be created through the registration screen.

## 4. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` and `/uploads` to the backend, so the
default `VITE_API_URL=/api` needs no changes for local development.

## 5. Production build

```bash
cd backend
set -a && source .env && set +a
./mvnw clean verify

cd ../frontend
npm ci
npm run build
```

The backend artifact is `backend/target/nexswap-backend-1.0.0.jar`. The frontend static
build is placed in `frontend/dist`.

Run the packaged backend (environment variables must be exported first):

```bash
cd backend
set -a && source .env && set +a
java -jar target/nexswap-backend-1.0.0.jar
```

For a separately hosted frontend, set `VITE_API_URL=https://api.example.com/api`,
`VITE_MEDIA_URL=https://api.example.com`, and add the frontend origin to
`CORS_ALLOWED_ORIGINS` on the backend.

## API overview

All protected endpoints require `Authorization: Bearer <token>`. A complete endpoint
reference, request bodies and sample responses are available in
[`docs/API.md`](docs/API.md).

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Register a student and receive a JWT |
| POST | `/api/auth/login` | Public | Authenticate and receive a JWT |
| POST | `/api/auth/logout` | Public | Client-side token logout acknowledgement |
| GET/PUT | `/api/users/me` | Authenticated | Read/update profile |
| PUT | `/api/users/me/password` | Authenticated | Change password |
| GET | `/api/books` | Public | Search, filter, sort and paginate books |
| GET | `/api/books/featured` | Public | Featured available books |
| GET | `/api/books/categories` | Public | Categories with live counts |
| GET | `/api/books/{id}` | Public | Book details |
| GET | `/api/books/{id}/contact` | Authenticated | Seller contact details |
| GET | `/api/books/my-listings` | Authenticated | The current student's listings |
| POST/PUT/DELETE | `/api/books...` | Owner/Admin | Manage listings |
| POST | `/api/books/{id}/image` | Owner/Admin | Upload or replace a cover image |
| POST | `/api/exchanges` | Authenticated | Request an exchange or purchase |
| GET | `/api/exchanges/received` | Authenticated | Requests received |
| GET | `/api/exchanges/sent` | Authenticated | Requests sent |
| PATCH | `/api/exchanges/{id}/accept` | Owner | Accept a pending request |
| PATCH | `/api/exchanges/{id}/reject` | Owner | Reject a pending request |
| PATCH | `/api/exchanges/{id}/cancel` | Requester | Cancel a pending request |
| PATCH | `/api/exchanges/{id}/complete` | Participant | Complete an accepted exchange |
| GET | `/api/dashboard/stats` | Authenticated | Personal dashboard counters |
| GET | `/api/admin/stats` | Admin | Platform counters |
| GET | `/api/admin/users` | Admin | Student directory |

## Exchange rules

1. A student cannot request their own listing.
2. An **Exchange** listing requires the requester to offer one of their own available
   books. A **Sell** listing does not.
3. Only one pending request per student per book is allowed.
4. Accepting a request reserves both the requested book and the offered book, and
   automatically rejects other pending requests for the requested book.
5. The owner or requester can mark an accepted exchange as completed. Completion marks
   both books as exchanged.
6. Pending requests can be rejected by the owner or cancelled by the requester.
7. Deleting a listing is a soft delete so that exchange history remains auditable.
   Listings with an accepted exchange cannot be deleted until it is completed.

## Security and design notes

- Passwords are hashed with BCrypt; JWT signing keys come from the environment.
- CORS origins are allow-listed and configurable.
- Bean Validation protects every request body.
- API errors use a consistent JSON envelope from a central exception handler.
- Cover uploads are restricted to image MIME types and a 5 MB size limit.
- Uploaded files use randomised names and are never executed.
- The public catalogue never exposes seller email addresses; contact details require
  a signed-in student.
- Timestamps are stored in UTC.

## Useful commands

```bash
# Backend integration tests (H2 in-memory database; no MySQL needed)
cd backend && ./mvnw test

# Full backend verification (tests + packaged JAR)
cd backend && ./mvnw clean verify

# Frontend lint / production build
cd frontend && npm run lint && npm run build

# Inspect MySQL schema
mysql -u nexswap -p nexswap -e "SHOW TABLES; DESCRIBE books; DESCRIBE exchange_requests;"
```

The backend test suite covers registration, login, profile updates, password changes,
role checks, listing CRUD and validation, search/filter/sort, image upload, the full
exchange request lifecycle, dashboard counters, and admin endpoints.

## Troubleshooting

- **Backend fails with `Could not resolve placeholder 'DB_PASSWORD'`** — export the
  variables from `backend/.env` before starting the application.
- **Frontend gets `ECONNREFUSED`** — the Vite proxy expects the backend on port 8080.
  Start the backend first, or update `vite.config.js`.
- **Images do not load in production** — set `VITE_MEDIA_URL` to the backend origin and
  make sure the backend can serve `/uploads/**`.
- **CORS error** — add the exact frontend origin (including protocol and port) to
  `CORS_ALLOWED_ORIGINS`.
