# Slotly — Scheduling Made Simple

A modern, full-stack appointment scheduling application built with **React, TypeScript, NestJS, and PostgreSQL**.

Slotly makes it easy for a host to publish available time slots and for guests to reserve an appointment without creating an account. The application focuses on a straightforward booking experience, clear availability, and reliable server-side prevention of double bookings.

**Built for the TeamLift Product Engineer Internship Challenge (2026).**

## Live Demo

| | Link |
| --- | --- |
| **Book an appointment** | [slotly-teamlift.vercel.app](https://slotly-teamlift.vercel.app/) |
| **Host dashboard** | [slotly-teamlift.vercel.app/dashboard](https://slotly-teamlift.vercel.app/dashboard) |
| **Backend API** | [slotly-api-zlfm.onrender.com/api](https://slotly-api-zlfm.onrender.com/api) |
| **API health check** | [slotly-api-zlfm.onrender.com/api/health](https://slotly-api-zlfm.onrender.com/api/health) |
| **Source code** | [github.com/nikolasarafimov/slotly-teamlift](https://github.com/nikolasarafimov/slotly-teamlift) |

> **Demo hosting:** The backend runs on a Render free instance, which can spin down during inactivity. The first request after an idle period may take longer than usual. The demo database uses a time-limited free plan; availability of the live demo may change.

## Features

### For guests

- Browse open appointment slots grouped by date.
- View start times and durations in the browser's local time zone.
- Reserve an appointment by entering a name and email address — **no account required**.
- See a booking confirmation with the appointment details and booking ID.
- Refresh availability and receive clear loading, empty, success, and error states.
- Use a responsive interface on mobile, tablet, and desktop.

### For the host

- Create future appointments with a start date/time and duration (15–240 minutes).
- Access slot creation through a server-validated **host access key**.
- Review all slots in the dashboard and filter by available, booked, or expired status.
- View summary counts for total, available, and booked appointments.
- Receive validation feedback when a new slot overlaps an existing one.

### Reliability and security

- Persist slots and bookings in PostgreSQL.
- Prevent overlapping slot creation using PostgreSQL advisory transaction locks.
- Prevent double booking using an atomic conditional update inside a transaction and a unique database constraint on the booking's slot ID.
- Validate request payloads using NestJS DTOs and `ValidationPipe`.
- Limit API request rates with NestJS Throttler.
- Apply HTTP security headers using Helmet and restrict browser origins through CORS.
- Manage database schema changes through versioned TypeORM migrations.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router, Lucide React |
| Backend | NestJS 12, TypeScript, REST API, class-validator |
| Data access | TypeORM, PostgreSQL 17 |
| Local development | Node.js, npm, Docker Compose |
| Deployment | Vercel (frontend), Render (API and PostgreSQL) |
| Testing and tooling | Node.js test runner, Jest configuration, ESLint, Oxlint, TypeScript |

## Architecture

```text
Guest / Host
     |
     v
React + TypeScript (Vercel)
     |
     | HTTPS / REST
     v
NestJS API (Render)
     |
     | TypeORM / transactions
     v
PostgreSQL (Render)
```

The frontend requests available slots from the API. When a guest submits a booking, the backend atomically marks the selected slot as booked and stores the reservation in the same transaction. If another request has already claimed the slot, the API rejects the later request with `409 Conflict`.

The dashboard is a public page, but **creating slots requires a host key**. Reading slot metadata and guest booking do not require authentication.

## Repository Structure

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
│   │   │   ├── guards/
│   │   │   ├── slots.controller.ts
│   │   │   └── slots.service.ts
│   │   ├── app.module.ts
│   │   ├── db-health.controller.ts
│   │   └── main.ts
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   ├── pages/
│   │   │   ├── BookingPage.tsx
│   │   │   └── DashboardPage.tsx
│   │   ├── types/
│   │   └── App.tsx
│   ├── vercel.json
│   └── .env.example
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Getting Started Locally

### Prerequisites

- Node.js 24 and npm
- Docker Desktop with Docker Compose
- Git

### 1. Clone the repository

```bash
git clone https://github.com/nikolasarafimov/slotly-teamlift.git
cd slotly-teamlift
```

### 2. Start PostgreSQL

From the repository root:

```bash
docker compose up -d
```

The local Docker configuration exposes PostgreSQL on `127.0.0.1:5433`, with database name and user `slotly`.

### 3. Configure and start the API

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
HOST_ACCESS_KEY=replace-with-a-unique-random-secret-of-at-least-32-characters
```

The local database credentials above match the repository's development-only Docker Compose configuration. **Do not reuse them in production.** Generate a strong, unique host key; do not commit real `.env` files.

Start NestJS:

```bash
npm run start:dev
```

The API is available at `http://localhost:3000/api`. Verify the database connection at `http://localhost:3000/api/health`.

> In development, TypeORM synchronizes entities with the local schema. Production disables synchronization and runs explicit migrations instead.

### 4. Configure and start the frontend

In a separate terminal:

```bash
cd frontend
npm ci
```

Create `frontend/.env.local`:

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api
```

Start Vite:

```bash
npm run dev
```

Open:

- Booking page: `http://localhost:5173/`
- Host dashboard: `http://localhost:5173/dashboard`

Enter the host key configured in `backend/.env` when creating a slot from the dashboard. Guests do not need the key to make a booking.

## API Reference

**Production base URL:** `https://slotly-api-zlfm.onrender.com/api`

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Check API and database connectivity |
| `GET` | `/slots` | Public | List future, unbooked slots |
| `GET` | `/slots/all` | Public | List all slots, including booked and expired |
| `POST` | `/slots` | Host key | Create an appointment slot |
| `POST` | `/slots/:id/book` | Public | Book a slot using name and email |

### Create a slot

```http
POST /api/slots
Content-Type: application/json
X-Host-Key: YOUR_HOST_KEY
```

```json
{
  "startsAt": "2026-11-10T10:00:00.000Z",
  "durationMinutes": 30
}
```

The `startsAt` value must include a time zone and represent a future instant. Existing overlapping intervals are rejected.

**Success:** `201 Created`  
**Typical errors:** `400 Bad Request`, `401 Unauthorized`, `409 Conflict`, `429 Too Many Requests`

### Book a slot

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

A successful request returns a booking record and the updated slot. A second request for the same already-booked slot returns `409 Conflict`.

**Success:** `201 Created`  
**Typical errors:** `400 Bad Request`, `404 Not Found`, `409 Conflict`, `429 Too Many Requests`

### Time zones

Slot start times are stored as PostgreSQL `timestamptz` values and transferred as ISO 8601 timestamps. The frontend displays times using the visitor's browser time zone, avoiding hard-coded UTC offsets.

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

The repository includes `backend/scripts/api-smoke.test.mjs`, using the built-in Node.js test runner. Its seven scenarios cover:

1. Rejection of slot creation without a host key.
2. Successful creation of a future slot.
3. Rejection of overlapping slots.
4. Retrieval of available slots.
5. Two concurrent booking attempts, of which only one succeeds.
6. Removal of a booked slot from public availability.
7. Preservation of booked slots in dashboard history.

**Use a separate test database**, not a live or production database. For example, run a local backend instance on port `3100` with `DB_NAME=slotly_test`, then run the tests from another terminal.

PowerShell example:

```powershell
cd backend
$env:TEST_API_URL = 'http://localhost:3100/api'
$env:HOST_ACCESS_KEY = Read-Host 'Enter the test host key'
node --test scripts/api-smoke.test.mjs
```

These integration tests create actual data and should only target a disposable local test environment.

## Database Migrations

The initial schema migration is located in:

```text
backend/database/migrations/1792531200000-initial-slotly-schema.cjs
```

Available commands, from `backend/`:

```bash
npm run db:migrate:show
npm run db:migrate
```

The production database starts empty. Render runs pending migrations before starting the API:

```bash
npm run db:migrate && npm run start:prod
```

**Do not run the initial migration against an existing development database whose tables were already created with `synchronize: true`.** Do not execute destructive rollback commands against a database containing real bookings.

## Deployment

### Frontend — Vercel

- Root directory: `frontend`
- Framework: Vite
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable:

```dotenv
VITE_API_BASE_URL=https://slotly-api-zlfm.onrender.com/api
```

`frontend/vercel.json` contains an SPA rewrite so direct visits to `/dashboard` work.

### Backend — Render

- Root directory: `backend`
- Build command: `npm ci --include=dev && npm run build`
- Start command: `npm run db:migrate && npm run start:prod`
- Node.js runtime: 24
- `NODE_ENV=production` (TypeORM schema synchronization disabled)
- `FRONTEND_URL=https://slotly-teamlift.vercel.app`
- Configure `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_NAME` using the actual Render PostgreSQL connection details.
- Store `HOST_ACCESS_KEY` in Render environment settings, never in the frontend bundle or source control.

The PostgreSQL database and API should be hosted in the same Render region and use the internal database hostname. `DB_SSL=false` applies only to the trusted internal connection used by this deployment; external database connections may require TLS.

## Security and Known Limitations

- **Host-only writes:** Creating slots requires an access key checked by the backend. The dashboard page and slot listings are publicly accessible.
- **Guest access:** Bookings require a name and email but no user account or email verification.
- **No email delivery:** Successful bookings display an on-page confirmation; the app does not currently send confirmation emails.
- **No calendar integration:** Google Calendar sync and automated meeting invitations are not implemented.
- **Availability updates:** The UI fetches availability when loaded or manually refreshed. It does not use WebSockets; the backend remains authoritative when two clients attempt the same slot.
- **Rate limiting:** The default in-memory limiter is intended for the single demo API instance, not a distributed production fleet.
- **Demo infrastructure:** Free Render services may have cold starts, and free PostgreSQL hosting may expire or lack backups. Do not use the demo for sensitive or business-critical appointments.
- **Scope:** The application does not yet support cancelling/rescheduling bookings or full host account authentication.

## AI-Assisted Development Disclosure

This project was developed with assistance from **OpenAI ChatGPT**. AI was used during planning and implementation to help with application structure, React and NestJS code, TypeScript and ESLint troubleshooting, SQL/TypeORM design, integration-testing scripts, deployment configuration, and technical documentation.

The application was implemented through an iterative development workflow, with local execution, debugging, and validation of the backend, frontend, and database. AI-generated suggestions and code were treated as material to inspect and test, not as proof of correctness. The project author remains responsible for the final implementation and submission.

## Author

**Nikola Sarafimov**  
GitHub: [@nikolasarafimov](https://github.com/nikolasarafimov)

---

*Slotly — Make time for what matters.*