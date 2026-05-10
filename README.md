# Team Task Manager

Team Task Manager is a full-stack assignment app with a React/Vite frontend, Express REST API, direct PostgreSQL access through `pg`, and SQL-backed schema migrations. It supports secure signup/login, first-user Admin bootstrap, Admin/Member role enforcement, project membership, task assignment, status tracking, dashboard summaries, and Railway deployment evidence.

## Overview

- Frontend: React 18, Vite, React Router, TanStack Query.
- Backend: Express 5, TypeScript, Zod validation, HTTP-only signed cookie auth with `jose`.
- Database: PostgreSQL through versioned SQL migrations.
- Deployment: Railway backend service, Railway frontend service, Railway PostgreSQL.

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

Backend build/start:

```text
npm install && npm run build
npm run db:deploy && npm run start:prod
```

Frontend build/start:

```text
npm install && npm run build
npm run start
```

Set `VITE_API_BASE_URL` to the deployed backend `/api` URL and set backend `CORS_ORIGIN` to the deployed frontend URL.

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
