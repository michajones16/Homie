# Homie – Home Buying Goal Tracker

## Project Summary

Homie is a web app created to help first-time home buyers in Utah understand the process, resources, and necessary steps to prepare to buy their first home. We found that first time home buyers struggle in the home-buying process as savings needs are overwhelming, fees seem to pop up out of nowhere, and resources are hard to find and sometimes seem like they are trying to take advantage of customers. Our target customers are first time home buyers in Utah who do not have large amounts of savings and are trying to get in a financially smart position to purchase a home. Our web app gets new user information and tailors tasks, savings goals, and timelines to their needs. It has a step-by-step checklist to help users keep track of their progress and ensure that they are maximizing the resources that are available in Utah.


## Tech Stack
#### Architecture: PERN Stack (PostgreSQL, Express, React, Node.js)

### Frontend
- React
- Vite
- TypeScript

### Backend
- Node.js
- Express 5
- TypeScript
- tsx (TypeScript runtime for development)

### Database
- PostgreSQL
- node-postgres (pg) driver

### Authentication
- Session-based authentication
- bcryptjs (password hashing)
- cookie-parser (session cookie handling)
- Development auto-login route

### Environment Configuration
- .env environment variable configuration

## Architecture Diagram

```text
[ User / Browser ]
        |
        | HTTP (UI) + Cookies (session)
        v
[ React + Vite Frontend ]
        |
        | REST API calls to /api/*
        v
[ Node.js + Express API ]
        |
        | SQL queries (pg)
        v
[ PostgreSQL ]
```

## Project Structure

```
frontend/   – React + Vite frontend (port 5173)
backend/    – Express + TypeScript API (port 3001)
db/         – PostgreSQL schema and seed data
shared/     – Shared types and schemas
```

## Prerequisites

- Node.js 18+ (https://nodejs.org/en/download)
- PostgreSQL 14+ (https://www.postgresql.org/download/)
- psql available in system PATH

Verify Installations:

```bash
node -v
npm -v
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

If the port you run Postgres on is different than 5432 specify it in the command by adding "-p INSERT_PORT_HERE" to the end. Do that to the other psql commands if needed.

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

Ensure the `DATABASE_URL` in /backend/.env is uses the correct username and password for your postgres
Example `DATABASE_URL` for local dev:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/signspeak_dev
```

Edit `backend/.env` if your Postgres credentials differ.
Note: postgres:password must be replaced with your PostgresUsername:PostgresPassword on your local postgres

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

## Verifying Account Creation (Vertical Slice)

### Prerequisites
- Backend server running (`npm run dev` in `/backend`)
- Frontend running (`npm run dev` in `/frontend`)
- PostgreSQL running with `signspeak_dev` database

### Steps to Verify the Vertical Slice

1. **Create an Account**
   - Navigate to the Login page
   - Click "Sign Up"
   - Enter a username, email, password, and name
   - Click "Create Account"
   - You should be redirected to the Dashboard with your name showing (after setting some brief savings goals)

2. **Verify the Database Was Updated**
   - Open a terminal and connect to PostgreSQL:
     ```bash
     psql -U postgres -d signspeak_dev -h localhost
     ```
   - Query the users table with your username:
     ```sql
     SELECT username, email, first_name, last_name FROM public.users WHERE username = 'your_username';
     ```
     (Replace `'your_username'` with the username you created)
   - Confirm your user appears with the correct email and name

3. **Verify the Change Persists**
   - Refresh the page in your browser
   - Confirm you remain logged in and can see your account data
   - Log out and log back in with your credentials
   - Run the query again to confirm the account still exists

### Expected Outcome
- New user row created in the `users` table with hashed password
- User session persists across page refreshes
- User can successfully log in again
