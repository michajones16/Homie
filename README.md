# Homie – Home Buying Goal Tracker

## Project Summary

Homie is a web app created to help first-time home buyers in Utah understand the process, resources, and necessary steps to prepare to buy their first home. We found that first time home buyers struggle in the home-buying process as savings needs are overwhelming, fees seem to pop up out of nowhere, and resources are hard to find and sometimes seem like they are trying to take advantage of customers. Our target customers are first time home buyers in Utah who do not have large amounts of savings and are trying to get in a financially smart position to purchase a home. Our web app gets new user information and tailors tasks, savings goals, and timelines to their needs. It has a step-by-step checklist to help users keep track of their progress and ensure that they are maximizing the resources that are available in Utah.

## Project Structure

```
frontend/   – React + Vite frontend (port 5173)
backend/    – Express + TypeScript API (port 3001)
db/         – PostgreSQL schema and seed data
shared/     – Shared types and schemas
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

Verify Postgres is installed:

```bash
psql --version
```

## Setup

### 1. Install dependencies

```bash
# Root (installs concurrently)
npm install

# Frontend
cd frontend && npm install

# Backend
cd backend && npm install
```

### 2. Create the database

```bash
psql -U postgres -c "CREATE DATABASE signspeak_dev;"
```

### 3. Run schema and seed

```bash
psql -U postgres -d signspeak_dev -f db/schema.sql
psql -U postgres -d signspeak_dev -f db/seed.sql
```

The seed file is **idempotent** – you can re-run it safely without creating duplicates.

### 4. Verify tables were created

```bash
psql -U postgres -d signspeak_dev -c "\dt"
```

Check users:

```bash
psql -U postgres -d signspeak_dev -c "SELECT user_id, username, email, first_name FROM users LIMIT 5;"
```

### 5. Configure backend environment

```bash
cp backend/.env.example backend/.env
```

Example `DATABASE_URL` for local dev:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/signspeak_dev
```

Edit `backend/.env` if your Postgres credentials differ.

## Running Dev Servers

```bash
# Both frontend and backend concurrently
npm run dev

# Or individually:
npm run dev:frontend   # Vite on http://localhost:5173
npm run dev:backend    # Express on http://localhost:3001
```

The frontend Vite dev server proxies `/api/*` requests to the backend automatically.

## Auth (Dev Mode)

Clicking **Sign In** on the landing page hits `GET /api/login`, which auto-logs you in as the first seeded user (`jdoe`) and redirects to the dashboard. No password entry is needed in dev mode.

For programmatic access, use the POST endpoints:

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jdoe","password":"password123"}'

# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser","email":"new@example.com","password":"pass123","firstName":"New","lastName":"User"}'
```

## Seed Users

| Username | Password       |
|----------|----------------|
| jdoe     | password123    |
| asmith   | securepass456  |
| bwilson  | mypassword789  |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check (no DB needed) |
| GET | `/api/db-ping` | Test DB connection |
| GET | `/api/auth/user` | Current session user |
| POST | `/api/auth/login` | Login with username + password |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/login` | Dev auto-login (redirect) |
| GET | `/api/logout` | Destroy session (redirect) |
| GET | `/api/users` | List users (no password_hash) |
| GET | `/api/goals` | List goals for current user |
| POST | `/api/goals` | Create goal |
| PATCH | `/api/goals/:id` | Update goal (toggle complete, etc.) |
| DELETE | `/api/goals/:id` | Delete goal |
| POST | `/api/goals/generate-defaults` | Create starter goals |
| GET | `/api/user-settings` | Get plan/settings for user |
| PATCH | `/api/user-settings` | Upsert plan/settings |
| GET | `/api/plan?user_id=` | Get raw plan row |
| POST | `/api/plan` | Upsert plan (raw columns) |
| GET | `/api/reviews` | List all reviews |
| POST | `/api/reviews` | Create review |
| GET | `/api/resources` | List resources |
| GET | `/api/resources/:id` | Get resource detail |
