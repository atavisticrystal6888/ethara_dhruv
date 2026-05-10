# Quickstart: Team Task Manager

## Prerequisites

- Node.js 20 LTS
- npm 10 or compatible package manager
- PostgreSQL 15+ locally or a Railway PostgreSQL database
- Railway account and Railway CLI for deployment

## Environment Variables

Create backend environment files from these required values:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=replace-with-long-random-secret
COOKIE_SECURE=false
COOKIE_DOMAIN=localhost
CORS_ORIGIN=http://localhost:5173
PORT=3000
NODE_ENV=development
```

Production Railway values must use Railway-provided `DATABASE_URL`, a strong `JWT_SECRET`, `COOKIE_SECURE=true`, and the deployed frontend origin in `CORS_ORIGIN`.

## Local Setup

1. Install backend dependencies from `backend/`.
2. Install frontend dependencies from `frontend/`.
3. Configure `backend/.env` using the variables above.
4. Run database migrations from `backend/`.
5. Start the backend API on port 3000.
6. Start the frontend development server on port 5173.
7. Open the frontend URL and complete signup.

## Expected Local Commands

```text
cd backend
npm install
npm run prisma:migrate
npm run dev

cd ../frontend
npm install
npm run dev
```

## Verification Commands

```text
cd backend
npm run test
npm run test:contract

cd ../frontend
npm run test
npm run test:e2e
```

## Smoke Test Flow

1. Sign up as the first user and confirm the account is Admin.
2. Sign up or create a second user and confirm the default role is Member.
3. Log in as Admin and create a project.
4. Add the Member to the project.
5. Create at least three tasks: one To Do, one In Progress, one Done.
6. Assign one task to the Member and set one non-Done task due before today.
7. Log in as Member and confirm the Member can see the assigned project and task.
8. As Member, update the assigned task status.
9. As Member, attempt to manage membership and confirm the action is denied.
10. Open the dashboard as Admin and Member and verify counts, status totals, and overdue totals match persisted data.
11. Check desktop and mobile widths for no overlapping text, horizontal scrolling, or hidden primary actions.

## Railway Deployment

1. Create a Railway project.
2. Provision Railway PostgreSQL.
3. Add backend service and configure `DATABASE_URL`, `JWT_SECRET`, `COOKIE_SECURE=true`, `CORS_ORIGIN`, and production `NODE_ENV`.
4. Add a frontend service that builds `frontend/` and serves the Vite production build.
5. Run Prisma migrations against Railway PostgreSQL.
6. Verify `/health` returns `ok` from the deployed backend.
7. Open the live URL and complete the smoke test flow.
8. Record the live URL in `README.md` and submission materials.

## Submission Checklist

- Live Railway URL opens without local setup.
- GitHub repository contains backend, frontend, migrations, contracts, tests, and README.
- README includes overview, setup, environment variables, database setup, Railway steps, live URL, and demo video link.
- Demo video is 2-5 minutes and demonstrates auth, Admin/Member RBAC, project creation, membership, task assignment, status tracking, dashboard counts, and live deployment.