# Slotly — Scheduling Made Simple

A full-stack appointment scheduling application built with **React, TypeScript, NestJS, and PostgreSQL**.

Slotly lets a host publish appointment slots and lets guests reserve an available time using only their name and email address. The project emphasizes a straightforward, responsive interface, persistent storage, and reliable server-side prevention of conflicting appointments and double bookings.

**Created for the TeamLift Product Engineer Internship Challenge (2026).**

## Live Demo

| Resource | Link |
| --- | --- |
| **Book an appointment** | [slotly-teamlift.vercel.app](https://slotly-teamlift.vercel.app/) |
| **Create and manage slots** | [Slotly Dashboard](https://slotly-teamlift.vercel.app/dashboard) |
| **Backend API** | [Slotly REST API](https://slotly-api-zlfm.onrender.com/api) |
| **API health check** | [Health endpoint](https://slotly-api-zlfm.onrender.com/api/health) |
| **Source code** | [GitHub repository](https://github.com/nikolasarafimov/slotly-teamlift) |

> **Reviewer quick start:** Open the [Dashboard](https://slotly-teamlift.vercel.app/dashboard), create a future time slot, then open the [Booking Page](https://slotly-teamlift.vercel.app/) and reserve it with a test name and email address. Return to the Dashboard and refresh to see its status change to **booked**. **No login, account, or access key is required.**
>
> **Demo hosting:** The backend uses a free Render instance, which may need time to wake after inactivity. The free PostgreSQL instance has a limited lifetime and is not intended for permanent, business-critical data storage.

## Features

### Appointment booking

- Browse available future time slots grouped by date.
- View appointment start times, end times, and durations in the visitor's local time zone.
- Book an open slot using a name and email address, without registering or logging in.
- Receive an on-page confirmation with appointment details and a booking ID.
- Refresh availability and see clear loading, empty, success, and error states.
- Use the booking interface on desktop, tablet, and mobile screens.

### Scheduling dashboard

- Create future appointment slots with a date, start time, and duration from **15 to 240 minutes**.
- Review all created slots and filter by **available**, **booked**, or **expired**.
- See counts of total, available, and booked appointments.
- Receive feedback when an appointment overlaps an existing slot or fails validation.
- Test the full scheduling workflow without authentication, as specified by the challenge.

### Data integrity and API reliability

- Store slots and reservations in PostgreSQL.
- Reject overlapping slot creation using a PostgreSQL advisory transaction lock and an overlap query.
- Prevent double bookings with an atomic conditional database update inside a transaction.
- Enforce a unique booking-to-slot relationship at the database level.
- Validate API input using NestJS DTOs, `class-validator`, and a global `ValidationPipe`.
- Apply HTTP security headers with Helmet, configure CORS, and use API rate limiting.
- Maintain the database schema through versioned TypeORM migrations.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router, Lucide React |
| Backend | NestJS 12, TypeScript, REST API, `class-validator` |
| Database and ORM | PostgreSQL 17, TypeORM |
| Testing and quality | Node.js test runner, Jest configuration, ESLint, Oxlint, TypeScript |
| Local development | Node.js 24, npm, Docker Compose |
| Deployment | Vercel (frontend), Render (backend and PostgreSQL) |

## Architecture

```text
                          Guest / Host
                               |
                               v
                   React + TypeScript (Vercel)
                  Booking Page / Host Dashboard
                               |
                         HTTPS / JSON
                               |
                               v
                         NestJS REST API
                             (Render)
                               |
                  Validation + Transactions
                               |
                               v
                        PostgreSQL Database
                             (Render)
```

The React application calls the NestJS API to create slots, fetch availability, and make bookings. The API is responsible for all database writes and validates requests before processing them.

When two guests attempt to reserve the same slot, the backend performs an atomic update that only succeeds if the slot is still available. Exactly one request can claim the slot; a subsequent conflicting request receives **`409 Conflict`**. The booking record and slot update are saved in a transaction.

**Access model:** The Booking Page and Dashboard are both public in this challenge demo. No user accounts or host access keys are required. A real multi-user production application would require proper host authentication and authorization before allowing anyone to manage availability.

## Project Structure

```text
slotly-teamlift/
├── backend/
│   ├── database/
│   │   ├── data-source.cjs
│   │   └── migrations/
│   ├── scripts/
│   │   └── api-smoke.test.mjs
│   ├── src/
│   │   ├── slots/
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── slots.controller.ts
│   │   │   ├── slots.module.ts
│   │   │   └── slots.service.ts
│   │   ├── app.module.ts
│   │   ├── db-health.controller.ts
│   │   └── main.ts
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   ├── pages/
│   │   │   ├── BookingPage.tsx
│   │   │   └── DashboardPage.tsx
│   │   ├── types/
│   │   └── App.tsx
│   ├── .env.example
│   ├── vercel.json
│   └── package.json
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Run Locally

### Prerequisites

- Node.js 24 and npm
- Docker Desktop with Docker Compose
- Git

### 1. Clone the repository

```bash
git clone https://github.com/nikolasarafimov/slotly-teamlift.git
cd slotly-teamlift
```

### 2. Start the local database

From the repository root:

```bash
docker compose up -d
```

The Docker Compose configuration runs PostgreSQL 17 with a local development database called `slotly`, accessible at `127.0.0.1:5433`.

### 3. Configure the backend

```bash
cd backend
npm ci
```

Create `backend/.env` using `backend/.env.example` as a template:

```dotenv
NODE_ENV=development
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=5433
DB_USERNAME=slotly
DB_PASSWORD=slotly_dev_password
DB_NAME=slotly
DB_SSL=false

FRONTEND_URL=http://localhost:5173
```

The database credentials above are **development-only values** from `docker-compose.yml`; do not reuse them for a hosted database or commit actual `.env` files.

Start the API:

```bash
npm run start:dev
```

The backend runs at `http://localhost:3000/api`. Confirm its database connectivity at `http://localhost:3000/api/health`.

In development, TypeORM can synchronize the local schema. Production disables automatic synchronization and uses migrations instead.

### 4. Configure the frontend

In a separate terminal, from the repository root:

```bash
cd frontend
npm ci
```

Create `frontend/.env.local`:

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api
```

Start the application:

```bash
npm run dev
```

Visit:

- **Booking Page:** `http://localhost:5173/`
- **Dashboard:** `http://localhost:5173/dashboard`

You can create slots and book appointments directly; neither operation requires an account or an access key.

## API Reference

**Production base URL:** `https://slotly-api-zlfm.onrender.com/api`

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Check API and PostgreSQL connectivity |
| `GET` | `/slots` | Public | List future, unbooked slots |
| `GET` | `/slots/all` | Public | List all slots, including booked and expired |
| `POST` | `/slots` | Public | Create a future appointment slot |
| `POST` | `/slots/:id/book` | Public | Reserve a slot using a name and email address |

### Create a slot

**Request**

```http
POST /api/slots
Content-Type: application/json
```

```json
{
  "startsAt": "2026-11-10T10:00:00.000Z",
  "durationMinutes": 30
}
```

`startsAt` must be a future ISO 8601 datetime including a time zone. The API accepts integer durations from 15 to 240 minutes and rejects any interval that overlaps an existing slot.

- **Success:** `201 Created`
- **Possible errors:** `400 Bad Request`, `409 Conflict`, `429 Too Many Requests`

### List available slots

```http
GET /api/slots
```

Returns only future slots that have not yet been booked. The dashboard additionally uses `GET /api/slots/all` to display slot history and statuses.

### Book a slot

**Request**

```http
POST /api/slots/{slotId}/book
Content-Type: application/json
```

```json
{
  "name": "Demo User",
  "email": "demo@example.com"
}
```

A successful request returns an on-page confirmation payload containing the new booking and updated slot.

- **Success:** `201 Created`
- **Possible errors:** `400 Bad Request`, `404 Not Found`, `409 Conflict`, `429 Too Many Requests`

### Date and time handling

Appointment start times are stored as PostgreSQL `timestamptz` values and exchanged as ISO 8601 timestamps. The frontend formats start and end times in the visitor's browser time zone using the JavaScript `Intl.DateTimeFormat` API.

## Testing and Quality Checks

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

### Backend

```bash
cd backend
npm run lint
npm run build
```

### API integration tests

The repository includes `backend/scripts/api-smoke.test.mjs`, which uses the built-in Node.js test runner. The seven integration scenarios cover:

1. Rejection of invalid slot duration.
2. Successful creation of a future slot without authentication.
3. Rejection of overlapping appointments.
4. Retrieval of available slots.
5. Two concurrent booking attempts, with one success and one conflict.
6. Removal of the booked slot from public availability.
7. Preservation of the booked slot in dashboard history.

**Run these tests only against a separate local test database.** They create actual slots and bookings and must not target the deployed production database.

For example, create a `slotly_test` PostgreSQL database, then run a separate backend instance pointed at it on port `3100`:

```powershell
cd backend
$env:NODE_ENV = 'development'
$env:DB_NAME = 'slotly_test'
$env:PORT = '3100'
npm run start:dev
```

In another PowerShell terminal, from `backend/`:

```powershell
$env:TEST_API_URL = 'http://localhost:3100/api'
node --test scripts/api-smoke.test.mjs
```

The test database should be disposable and independent from both the primary local database and the hosted Render database.

## Database Migrations

The initial schema migration is located at:

```text
backend/database/migrations/1792531200000-initial-slotly-schema.cjs
```

From the `backend` directory:

```bash
npm run db:migrate:show
npm run db:migrate
```

Production deployment runs pending migrations before starting NestJS:

```bash
npm run db:migrate && npm run start:prod
```

Migration execution is recorded in PostgreSQL so already-applied migrations are not rerun. Production uses `synchronize: false`.

> **Safety note:** The initial migration is intended for an empty database. Do not run it against an existing development database whose tables were created by TypeORM synchronization. Avoid destructive rollbacks on databases containing bookings.

## Deployment

### Frontend — Vercel

- **Root directory:** `frontend`
- **Framework:** Vite
- **Install command:** `npm ci`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variable:**

```dotenv
VITE_API_BASE_URL=https://slotly-api-zlfm.onrender.com/api
```

`frontend/vercel.json` configures an SPA rewrite so the `/dashboard` route works when opened directly or refreshed.

### Backend — Render

- **Root directory:** `backend`
- **Build command:** `npm ci --include=dev && npm run build`
- **Start command:** `npm run db:migrate && npm run start:prod`
- **Node.js runtime:** 24
- **Environment variables:** `NODE_ENV=production`, `FRONTEND_URL=https://slotly-teamlift.vercel.app`, and the PostgreSQL connection settings (`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`).
- **Database connectivity:** Use the PostgreSQL internal hostname and a Render region compatible with the API service.

Database credentials are configured in Render, not committed to the repository. The demo does **not** require or use a host access key.

## Security and Known Limitations

- **Public demo workflow:** Both creating and booking slots are intentionally public to match the challenge's no-login requirement. Anyone with the link can create demo appointments. A real application would require host authentication and authorization.
- **No email verification:** The guest enters a name and email address, but email ownership is not verified.
- **No confirmation emails:** Successful bookings show an on-page confirmation only; emails are not sent.
- **No calendar synchronization:** Google Calendar integration and automated invitations are not implemented.
- **No cancellation or rescheduling:** Existing bookings cannot currently be edited or cancelled through the interface.
- **Availability refresh:** The UI fetches availability when loaded or manually refreshed. It does not use WebSockets or server-pushed updates; the backend resolves booking conflicts.
- **Basic rate limiting:** The API uses in-memory limits intended for a single demonstration instance. This is not a substitute for authentication or dedicated abuse prevention.
- **Demo infrastructure:** A free Render service may have cold starts, and free PostgreSQL hosting may expire or lack backups. Use test data only; do not treat this as a business-critical scheduling service.

## AI-Assisted Development Disclosure

**OpenAI ChatGPT** was used as a development assistant during the project. Assistance included planning the architecture, drafting React and NestJS implementations, troubleshooting TypeScript and ESLint issues, reasoning about database transactions and validation, designing integration tests, configuring deployment, and preparing technical documentation.

The application was built iteratively in VS Code, with manual integration, debugging, and functional verification. Generated suggestions were reviewed through local builds, tests, and end-to-end checks rather than assumed correct. Responsibility for understanding the implementation and submitting the final project remains with the author.

## Author

**Nikola Sarafimov**

GitHub: [@nikolasarafimov](https://github.com/nikolasarafimov)

---

*Slotly — Make time for what matters.*