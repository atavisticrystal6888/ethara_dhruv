# Railway Deployment Notes

## Topology

- Backend service: Express API from `backend/`.
- Frontend service: Vite static build from `frontend/`.
- Database service: Railway PostgreSQL.

Important:

- Do not deploy the FSWA repository root as a single Railway service.
- Railway/Nixpacks needs a start command for each deployable service, and the repository root intentionally does not define one because this app is split into two services.
- In Railway, create two services from the same repo and set the root directory for each service explicitly.

## Backend Service

- Root directory: `backend`
- Config-as-code file: `backend/railway.json`
- Build command: `npm run build`
- Pre-deploy command: `npm run db:deploy && npm run db:seed:deploy`
- Start command: `npm run start:prod`
- Health check path: `/api/health`

Required variables:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<strong random secret>
COOKIE_SECURE=true
COOKIE_DOMAIN=
COOKIE_SAME_SITE=none
CORS_ORIGIN=https://<frontend-domain>
NODE_ENV=production
PORT=${{PORT}}
```

Notes:

- Leave `COOKIE_DOMAIN` blank when the frontend and backend use different Railway domains. This keeps the session cookie host-only, which works with cross-origin requests when `COOKIE_SAME_SITE=none`, `COOKIE_SECURE=true`, and the frontend sends credentials.
- Set `COOKIE_DOMAIN` only if both services share a custom parent domain such as `.example.com`.

## Frontend Service

- Root directory: `frontend`
- Config-as-code file: `frontend/railway.json`
- Build command: `npm run build`
- Start command: `npm run start`
- Health check path: `/`

If Railway shows a generic image-build failure for the frontend or backend, first confirm the service root directory is set to `frontend` or `backend` rather than the repository root.

Required variables:

```text
VITE_API_BASE_URL=https://<backend-domain>/api
VITE_LIVE_URL=https://<frontend-domain>
PORT=${{PORT}}
```

## Import Steps

1. Create a Railway project and add a PostgreSQL service.
2. Add a backend service from this repository, set its root directory to `backend`, and verify Railway picks up `backend/railway.json`. If it does not, set the config file path to `/backend/railway.json` in the service settings.
3. Add a frontend service from this repository, set its root directory to `frontend`, and verify Railway picks up `frontend/railway.json`. If it does not, set the config file path to `/frontend/railway.json`.
4. Attach `DATABASE_URL` from the Railway PostgreSQL service to the backend service.
5. Generate public domains for both services.
6. Set `CORS_ORIGIN` on the backend to the frontend domain and `VITE_API_BASE_URL` on the frontend to the backend domain plus `/api`.
7. Redeploy both services after variables are set.

## Migration Command

Run migrations from the backend service before opening the live URL:

```text
npm run db:deploy
```

## Demo Seed Command

Railway now seeds the demo accounts and sample workspace data during backend pre-deploy so the live site includes the demo accounts as well:

```text
npm run db:seed:deploy
```

## Rollback Notes

1. Revert the backend and frontend service deployments to the last successful Railway deployment.
2. If a migration introduced incompatible schema changes, restore the Railway PostgreSQL backup captured before deployment.
3. Re-run the smoke test in `infra/railway/smoke-test.md` before resubmitting the live URL.

