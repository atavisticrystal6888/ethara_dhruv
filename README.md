# Team Task Manager

Team Task Manager is a full-stack assignment app with a React/Vite frontend, Express REST API, direct PostgreSQL access through `pg`, and SQL-backed schema migrations. It supports secure signup/login, first-user Admin bootstrap, project-scoped collaboration roles, member-created projects/tasks, multi-view task planning, recurring work, time tracking, dashboard reporting, and Railway deployment evidence.

## Overview

- Frontend: React 18, Vite, React Router, TanStack Query.
- Backend: Express 5, TypeScript, Zod validation, HTTP-only signed cookie auth with `jose`.
- Database: PostgreSQL through versioned SQL migrations.
- Deployment: Railway backend service, Railway frontend service, Railway PostgreSQL.

## MVP Features

- Secure signup and login with first-user Admin bootstrap.
- Project creation for any authenticated user; project owners/managers can manage collaborators.
- Project membership roles: `OWNER`, `MANAGER`, and `MEMBER`.
- Task assignment to individual users or delegated project roles.
- Multiple project views: list, Kanban board, timeline, and calendar.
- Recurring task support with auto-generated follow-up tasks after completion.
- Time tracking with manual logging, timer start/stop controls, and workload reporting.
- Dashboard summaries for completion rate, recurring work, tracked time, and per-project progress.

## Local Setup

Prerequisites:

- Node.js 20 LTS
- npm 10+
- PostgreSQL 15+ or Railway PostgreSQL

Install and run the backend:

```text
cp backend/.env.example backend/.env
cd backend
npm install
npm run db:migrate
```

Install and run the frontend:

```text
cp frontend/.env.example frontend/.env
cd frontend
npm install
```

Or run both apps together from the FSWA root:

```text
npm install
npm run db:migrate --workspace backend
npm run db:seed --workspace backend
npm run dev
```

Install and run the backend only:

```text
cd backend
npm install
npm run db:migrate
npm run dev
```

Open `http://localhost:5173`.

## Environment Variables

Backend:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=replace-with-long-random-secret
COOKIE_SECURE=false
COOKIE_DOMAIN=localhost
CORS_ORIGIN=http://localhost:5173
PORT=3000
NODE_ENV=development
```

Frontend:

```text
VITE_API_BASE_URL=http://localhost:3000/api
VITE_LIVE_URL=https://your-frontend.up.railway.app
```

## Database

SQL migrations live in `backend/db/migrations/`, and the migration runner lives in `backend/scripts/migrate.mjs`.

Run local migrations with:

```text
cd backend
npm run db:migrate
```

Seed local demo data with:

```text
cd backend
npm run db:seed
```

Demo credentials after seeding:

```text
avery@teamflow.demo / TeamFlow2026!
maya@teamflow.demo / TeamFlow2026!
```

Run production migrations on Railway with:

```text
cd backend
npm run db:deploy
```

## Tests

```text
cd backend
npm run test
npm run test:contract
npm run test:integration

cd ../frontend
npm run test
npm run test:e2e
```

Backend integration tests expect a reachable PostgreSQL database through `DATABASE_URL`.

## Railway Deployment

Create three Railway resources:

- PostgreSQL database.
- Backend service rooted at `backend/`.
- Frontend service rooted at `frontend/`.

Do not deploy the repository root as a single Railway service. This project is a two-service deploy, and the repository root intentionally has no `start` script for Nixpacks to run.

Each service already includes Railway config-as-code:

- `backend/railway.json`
- `frontend/railway.json`

Backend build/deploy:

```text
npm run build
npm run db:deploy
npm run start:prod
```

Frontend build/start:

```text
npm run build
npm run start
```

Set backend variables:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<strong random secret>
COOKIE_SECURE=true
COOKIE_DOMAIN=
COOKIE_SAME_SITE=none
CORS_ORIGIN=https://<frontend-domain>
NODE_ENV=production
```

Set frontend variables:

```text
VITE_API_BASE_URL=https://<backend-domain>/api
VITE_LIVE_URL=https://<frontend-domain>
```

Leave `COOKIE_DOMAIN` blank unless both services share the same parent custom domain.

Full deployment notes are in `infra/railway/deployment-notes.md`.

## Live URL

Add the final Railway frontend URL here before submission:

```text
https://your-frontend.up.railway.app
```

## Demo Video

Add the final 2-5 minute demo video link here before submission:

```text
https://example.com/demo-video
```

The walkthrough outline is in `docs/demo-script.md`.
