# Railway Deployment Notes

## Topology

- Backend service: Express API from `backend/`.
- Frontend service: Vite static build from `frontend/`.
- Database service: Railway PostgreSQL.

## Backend Service

- Root directory: `backend`
- Build command: `npm install && npm run build`
- Start command: `npm run db:deploy && npm run start:prod`
- Health check path: `/api/health`

Required variables:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<strong random secret>
COOKIE_SECURE=true
COOKIE_DOMAIN=<backend-domain-or-empty-if-cross-domain>
CORS_ORIGIN=https://<frontend-domain>
NODE_ENV=production
PORT=${{PORT}}
```

## Frontend Service

- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Start command: `npm run start`

Required variables:

```text
VITE_API_BASE_URL=https://<backend-domain>/api
VITE_LIVE_URL=https://<frontend-domain>
PORT=${{PORT}}
```

## Migration Command

Run migrations from the backend service before opening the live URL:

```text
npm run db:deploy
```

## Rollback Notes

1. Revert the backend and frontend service deployments to the last successful Railway deployment.
2. If a migration introduced incompatible schema changes, restore the Railway PostgreSQL backup captured before deployment.
3. Re-run the smoke test in `infra/railway/smoke-test.md` before resubmitting the live URL.

