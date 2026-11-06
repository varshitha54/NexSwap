# NexSwap API Reference

The NexSwap backend is a stateless Spring Boot REST API. All endpoints are prefixed with `/api`.
JSON is used for request and response bodies. Authenticated endpoints require a Bearer JWT:

```http
Authorization: Bearer <token>
```

Local base URL: `http://localhost:8080`. The Vite dev server proxies `/api` and `/uploads`
to that address, so the frontend can use relative URLs.

---

## Authentication and access

| Area | Access |
| --- | --- |
| `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout` | Public |
| `GET /api/public/stats` | Public |
| `GET /api/books`, `/api/books/featured`, `/api/books/categories`, `/api/books/{id}` | Public |
| `GET /uploads/**` | Public |
| `GET /api/books/my-listings`, `GET /api/books/{id}/contact` | Any signed-in user |
| Book create/update/status/image/delete | Signed-in owner (or admin) |
| Exchange endpoints, dashboard, profile | Any signed-in user |
| `GET /api/admin/stats`, `GET /api/admin/users` | Admin only |

The JWT is returned by register/login and expires after `JWT_EXPIRATION_MS`
(24 hours by default). Logging out is a client-side token discard; the API endpoint
returns a confirmation message and the client removes the token.

---

## Error format

All handled errors use a consistent body:

```json
{
  "timestamp": "2026-11-05T09:30:12.431Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Please correct the highlighted fields.",
  "path": "/api/auth/register",
  "fieldErrors": {
    "email": "Enter a valid email address"
  }
}
```

`fieldErrors` is omitted when there are no field-level errors. Common statuses:

| Status | Meaning |
| --- | --- |
| `400` | Validation failure, malformed body, or invalid parameter |
| `401` | Missing/expired token, or invalid login credentials |
| `403` | Authenticated but not allowed (for example a non-owner editing a listing) |
| `404` | Book, user, or exchange not found |
| `409` | Conflicting action (duplicate email, unavailable book, duplicate request) |
| `413` | Uploaded image exceeds 5 MB |
| `500` | Unexpected server error |

---

## Enumerations

**Book category** — `COMPUTER_SCIENCE`, `ENGINEERING`, `BUSINESS`, `SCIENCE`,
`MATHEMATICS`, `LITERATURE`, `ARTS_DESIGN`, `COMPETITIVE_EXAMS`, `OTHER`

**Book condition** — `NEW`, `LIKE_NEW`, `GOOD`, `FAIR`, `POOR`

**Listing type** — `SELL`, `EXCHANGE`

**Book status** — `AVAILABLE`, `RESERVED`, `EXCHANGED`, `HIDDEN`, `DELETED`

**Exchange status** — `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`, `COMPLETED`

**Role** — `STUDENT`, `ADMIN`

---

## Health

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/actuator/health` | Public | Spring Boot health probe, returns `{"status":"UP"}`. |

---

## Authentication

### Register

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "name": "Aarav Sharma",
  "email": "student@example.com",
  "password": "ExamplePassword123!",
  "collegeName": "North Campus University",
  "phone": "+91 98765 43210"
}
```

`name` 2–80 chars, valid unique email, password 8–72 chars, college 2–160 chars,
phone optional (7–30 digits/`+()-\s`). Returns `201 Created`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400000,
  "user": {
    "id": 1,
    "name": "Aarav Sharma",
    "email": "student@example.com",
    "collegeName": "North Campus University",
    "phone": "+91 98765 43210",
    "role": "STUDENT",
    "createdAt": "2026-11-05T09:20:00"
  }
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{ "email": "student@example.com", "password": "ExamplePassword123!" }
```

Returns `200 OK` with the same `AuthResponse` shape. Invalid credentials return `401`
with `"Invalid email or password."`.

### Logout

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

Returns `200 OK`:

```json
{ "message": "Signed out successfully." }
```

---

## Public statistics

```http
GET /api/public/stats
```

```json
{
  "availableBooks": 24,
  "registeredStudents": 11,
  "completedExchanges": 7
}
```

---

## Profile

### Get current profile

```http
GET /api/users/me
Authorization: Bearer <token>
```

```json
{
  "id": 1,
  "name": "Aarav Sharma",
  "email": "student@example.com",
  "collegeName": "North Campus University",
  "phone": "+91 98765 43210",
  "role": "STUDENT",
  "createdAt": "2026-11-05T09:20:00"
}
```

### Update profile

```http
PUT /api/users/me
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "name": "Aarav Sharma",
  "collegeName": "North Campus University",
  "phone": "+91 98765 43210"
}
```

Email and role cannot be changed through this endpoint. Returns the updated user.

### Change password

```http
PUT /api/users/me/password
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{ "currentPassword": "old-password", "newPassword": "new-password-123" }
```

Returns `200 OK`:

```json
{ "message": "Password updated successfully." }
```

---

## Books

### Shared book shape

```json
{
  "id": 12,
  "title": "Introduction to Algorithms",
  "author": "Thomas H. Cormen",
  "description": "Fourth edition. Clean pages, minimal highlighting.",
  "category": "COMPUTER_SCIENCE",
  "price": 420.00,
  "condition": "GOOD",
  "listingType": "EXCHANGE",
  "status": "AVAILABLE",
  "imageUrl": "/uploads/books/9f1c2a3b-cover.webp",
  "seller": {
    "id": 3,
    "name": "Meera Iyer",
    "collegeName": "North Campus University"
  },
  "createdAt": "2026-11-04T17:31:22",
  "updatedAt": "2026-11-04T17:31:22"
}
```

`imageUrl` may be `null`; the frontend renders a designed fallback cover in that case.
`price` is expressed in INR and is always the asking/estimated value.

### Search the catalogue

```http
GET /api/books?q=algorithms&category=COMPUTER_SCIENCE&listingType=EXCHANGE
    &condition=GOOD&minPrice=100&maxPrice=800&sort=newest&page=0&size=12
```

All parameters are optional. Only public (`AVAILABLE`) listings are returned to
anonymous callers; owners can still load their own hidden listings by direct detail URL.

| Parameter | Default | Notes |
| --- | --- | --- |
| `q` | — | Case-insensitive match on title, author, or description |
| `category` | — | One category enum value |
| `listingType` | — | `SELL` or `EXCHANGE` |
| `condition` | — | One condition enum value |
| `minPrice` / `maxPrice` | — | Inclusive decimal bounds |
| `sort` | `newest` | `newest`, `oldest`, `price_asc`, `price_desc`, `title_asc` |
| `page` | `0` | Zero-based page index |
| `size` | `12` | Capped at `50` |

Response:

```json
{
  "content": [ { "id": 12, "title": "Introduction to Algorithms" } ],
  "page": 0,
  "size": 12,
  "totalElements": 1,
  "totalPages": 1,
  "last": true,
  "first": true
}
```

### Featured books

```http
GET /api/books/featured?limit=8
```

Returns up to 12 available books ordered newest first, as an array of book objects.

### Category counts

```http
GET /api/books/categories
```

```json
[
  { "category": "COMPUTER_SCIENCE", "count": 9 },
  { "category": "ENGINEERING", "count": 4 },
  { "category": "BUSINESS", "count": 0 }
]
```

All category enum values are returned, including those with zero available books.

### Get a book

```http
GET /api/books/{id}
```

Returns the shared book shape. Hidden listings are only visible to their owner and to
admins; other callers receive `404`. Reserved and exchanged listings stay visible so
students can see that a book is temporarily or fully off the market.

### Get seller contact details

```http
GET /api/books/{id}/contact
Authorization: Bearer <token>
```

```json
{
  "sellerId": 3,
  "name": "Meera Iyer",
  "email": "meera@university.edu",
  "phone": "+91 90000 11111",
  "collegeName": "North Campus University"
}
```

Contact details are intentionally unavailable on public book responses and require a
signed-in user.

### My listings

```http
GET /api/books/my-listings
Authorization: Bearer <token>
```

Returns all non-deleted listings owned by the current user, including `HIDDEN`,
`RESERVED`, and `EXCHANGED`, newest first.

### Create a listing

```http
POST /api/books
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "title": "Introduction to Algorithms",
  "author": "Thomas H. Cormen",
  "description": "Fourth edition. Clean pages, minimal highlighting.",
  "category": "COMPUTER_SCIENCE",
  "price": 420.00,
  "condition": "GOOD",
  "listingType": "EXCHANGE"
}
```

Returns `201 Created` with the new book. `price` must be `>= 0` with at most two decimals.
`SELL` listings can be requested by any signed-in user; `EXCHANGE` requests must include
an offered book.

### Update a listing

```http
PUT /api/books/{id}
Authorization: Bearer <token>
Content-Type: application/json
```

Same body as create. Only the owner or an admin may update. Reserved or exchanged
listings cannot be edited until their exchange is completed.

### Change listing status

```http
PATCH /api/books/{id}/status
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{ "status": "HIDDEN" }
```

Owners/admins may switch between `AVAILABLE` and `HIDDEN`. `RESERVED`, `EXCHANGED`, and
`DELETED` are managed by the exchange lifecycle and cannot be set directly.

### Upload a cover image

```http
POST /api/books/{id}/image
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Form field: `file` (JPG, PNG, WEBP, or GIF, maximum 5 MB). The file is validated by
content type and stored under `UPLOAD_DIR`. Returns the updated book with `imageUrl`.
Replacing an image removes the previous file.

### Delete a listing

```http
DELETE /api/books/{id}
Authorization: Bearer <token>
```

Soft-deletes the listing (`status = DELETED`) so exchange history remains intact, and
returns `204 No Content`. Only the owner or an admin may delete. Open requests are closed.

---

## Exchange requests

### Shared exchange shape

```json
{
  "id": 8,
  "book": {
    "id": 12,
    "title": "Introduction to Algorithms",
    "author": "Thomas H. Cormen",
    "imageUrl": null,
    "price": 420.00,
    "category": "COMPUTER_SCIENCE",
    "condition": "GOOD",
    "listingType": "EXCHANGE",
    "status": "PENDING"
  },
  "offeredBook": {
    "id": 15,
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "imageUrl": "/uploads/books/abc.webp",
    "price": 350.00,
    "category": "COMPUTER_SCIENCE",
    "condition": "LIKE_NEW",
    "listingType": "SELL",
    "status": "PENDING"
  },
  "requester": {
    "id": 1,
    "name": "Aarav Sharma",
    "email": "student@example.com",
    "phone": "+91 98765 43210",
    "collegeName": "North Campus University"
  },
  "owner": {
    "id": 3,
    "name": "Meera Iyer",
    "email": "meera@university.edu",
    "phone": "+91 90000 11111",
    "collegeName": "North Campus University"
  },
  "message": "I can meet near the library on Tuesday.",
  "status": "PENDING",
  "createdAt": "2026-11-04T18:02:11",
  "updatedAt": "2026-11-04T18:02:11",
  "respondedAt": null,
  "completedAt": null
}
```

`offeredBook` is `null` for a purchase request against a `SELL` listing.
The book status shown inside an exchange is the status at the time the exchange
is serialised; the full book endpoint reflects current availability.

### Create a request

```http
POST /api/exchanges
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "bookId": 12,
  "offeredBookId": 15,
  "message": "I can meet near the library on Tuesday."
}
```

- `bookId` (required): the listing being requested.
- `offeredBookId`: required when the requested listing is `EXCHANGE`; must be an
  `AVAILABLE` listing owned by the requester. Omit or send `null` for a `SELL` listing.
- `message`: optional, at most 1000 characters.

Returns `201 Created`. The owner cannot request their own book, the requested book must
be `AVAILABLE`, and a requester cannot have two pending requests for the same book.

### Requests received / sent

```http
GET /api/exchanges/received
GET /api/exchanges/sent
Authorization: Bearer <token>
```

Both return an array of exchange objects, newest first.

### Accept a request

```http
PATCH /api/exchanges/{id}/accept
Authorization: Bearer <token>
```

Only the owner of the requested book may accept a `PENDING` request. Accepting:

1. sets the exchange to `ACCEPTED` and records `respondedAt`;
2. sets the requested book **and** the offered book (if any) to `RESERVED`;
3. rejects all other pending requests for the same requested book.

### Reject a request

```http
PATCH /api/exchanges/{id}/reject
Authorization: Bearer <token>
```

Only the owner may reject a `PENDING` request. The exchange becomes `REJECTED` and the
book stays available.

### Cancel a request

```http
PATCH /api/exchanges/{id}/cancel
Authorization: Bearer <token>
```

Only the requester may cancel a `PENDING` request. The exchange becomes `CANCELLED`.

### Complete an exchange

```http
PATCH /api/exchanges/{id}/complete
Authorization: Bearer <token>
```

Either participant may complete an `ACCEPTED` exchange. The exchange becomes `COMPLETED`,
records `completedAt`, and marks the requested book and offered book as `EXCHANGED`.

### Lifecycle summary

```
PENDING ──accept──> ACCEPTED ──complete──> COMPLETED
   │                    │
   ├──reject──> REJECTED│
   └──cancel──> CANCELLED
```

Invalid transitions return `400`/`403`/`409` with a descriptive message.

---

## Dashboard

```http
GET /api/dashboard/stats
Authorization: Bearer <token>
```

```json
{
  "totalBooksListed": 5,
  "activeListings": 3,
  "pendingIncomingRequests": 2,
  "sentPendingRequests": 1,
  "completedExchanges": 4,
  "exchangedBooks": 5,
  "recentListings": [ { "id": 12, "title": "Introduction to Algorithms" } ],
  "recentReceivedRequests": [ { "id": 8, "status": "PENDING" } ],
  "recentSentRequests": [ { "id": 9, "status": "ACCEPTED" } ]
}
```

`recentListings` contains up to 5 book objects; the request arrays contain complete
exchange objects (up to 5 received and 5 sent for the dashboard view).

---

## Admin

Both endpoints require an `ADMIN` role; students receive `403`.

### Platform statistics

```http
GET /api/admin/stats
Authorization: Bearer <token>
```

```json
{
  "totalStudents": 11,
  "totalBooks": 24,
  "availableBooks": 17,
  "completedExchanges": 7,
  "pendingRequests": 4
}
```

### Users

```http
GET /api/admin/users
Authorization: Bearer <token>
```

```json
[
  {
    "id": 1,
    "name": "Aarav Sharma",
    "email": "student@example.com",
    "collegeName": "North Campus University",
    "phone": "+91 98765 43210",
    "role": "STUDENT",
    "createdAt": "2026-11-05T09:20:00"
  }
]
```

---

## Static uploads

Images are served directly from the backend:

```http
GET /uploads/books/{filename}
```

The value returned in `imageUrl` is already an absolute API path (for example
`/uploads/books/9f1c2a3b-cover.webp`). The Vite dev server proxies this prefix to the
backend; in production, serve the `UPLOAD_DIR` directory alongside the API or through the
same reverse proxy.

---

## Quick curl smoke test

```bash
API=http://localhost:8080

# Public catalogue
curl -s "$API/api/books?size=3" | jq

# Register and capture a token
TOKEN=$(curl -s -X POST "$API/api/auth/register" \
  -H 'Content-Type: application/json' \
  -d '{
    "name":"Test Student",
    "email":"test.student@example.edu",
    "password":"student-pass-123",
    "collegeName":"Test University",
    "phone":"+91 90000 00000"
  }' | jq -r '.token')

# Create a listing
curl -s -X POST "$API/api/books" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "title":"Clean Code",
    "author":"Robert C. Martin",
    "description":"A handbook of agile software craftsmanship.",
    "category":"COMPUTER_SCIENCE",
    "price":350,
    "condition":"LIKE_NEW",
    "listingType":"SELL"
  }' | jq

# Dashboard
curl -s "$API/api/dashboard/stats" \
  -H "Authorization: Bearer $TOKEN" | jq
```
