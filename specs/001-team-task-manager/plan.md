# Implementation Plan: Team Task Manager

**Branch**: `001-team-task-manager` | **Date**: 2026-05-10 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-team-task-manager/spec.md`

**Note**: This plan is governed by [FSWA/.specify/memory/constitution.md](../../.specify/memory/constitution.md). It preserves server-side RBAC, persisted relationships, documented REST contracts, Railway deployability, and submission evidence.

## Summary

Build a full-stack Team Task Manager as a React single-page frontend backed by an Express REST API and PostgreSQL database. The system supports signup/login, first-user Admin bootstrap, Admin/Member project membership, task assignment and status tracking, dashboard summaries, responsive UI states, and Railway deployment with README and demo evidence.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20 LTS  
**Frontend**: React 18 + Vite + React Router + TanStack Query  
**Backend**: Express 5 REST API with layered route, service, validation, and authorization modules  
**Primary Dependencies**: Prisma ORM, Zod validation, bcrypt password hashing, jose for signed auth tokens, cookie-parser, helmet, cors, pino logging, lucide-react for icons  
**Storage**: PostgreSQL on Railway, accessed through Prisma migrations and generated client  
**Authentication**: Email/password login with secure HTTP-only cookie carrying a signed short-lived access token; password reset and third-party auth are out of scope for v1  
**Testing**: Vitest for unit tests, Supertest for REST contract/integration tests, Playwright for critical end-to-end and responsive smoke tests  
**Deployment Target**: Railway with three resources: a backend Express API service, a frontend Vite static web service, and Railway PostgreSQL  
**Project Type**: Full-stack web application  
**Performance Goals**: Dashboard summary and project/task list API responses under 300 ms p95 for classroom-demo scale; first meaningful UI view under 2 seconds on a normal broadband connection  
**Constraints**: Server-side Admin/Member RBAC, persisted overdue calculation rules, database-backed relationships, no leaked internal errors, Railway environment-managed secrets, evaluator-accessible live URL  
**Scale/Scope**: Assignment submission scope with approximately 100 active users, 50 projects, and 5,000 tasks without schema or architecture changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Server-Enforced Identity & Roles**: PASS. All protected endpoints require authentication; Admin-only membership/project/task management is enforced in backend authorization middleware and service checks. Members can view their projects and update assigned task status only.
- **Relational Domain Integrity**: PASS. The model includes User, Project, Membership, Task, Role, and status lifecycle rules. Task assignment validates project membership and rejects cross-project assignments.
- **Contract-First REST Delivery**: PASS. The plan produces [contracts/openapi.yaml](contracts/openapi.yaml) for auth, projects, memberships, tasks, dashboard, and health endpoints before implementation.
- **Production-Ready Railway Operation**: PASS. Railway PostgreSQL, migrations, env vars, health check, live smoke test, and README deployment instructions are included in design outputs.
- **Evidence-Based Delivery**: PASS. Contract/integration/e2e tests cover auth, RBAC, project membership, task lifecycle, dashboard counts, UI states, README, and demo checklist.

## Project Structure

### Documentation (this feature)

```text
specs/001-team-task-manager/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
backend/
├── package.json
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── api/
│   │   ├── middleware/
│   │   │   ├── error.ts
│   │   │   └── validate.ts
│   │   ├── auth.routes.ts
│   │   ├── dashboard.routes.ts
│   │   ├── health.routes.ts
│   │   ├── membership.routes.ts
│   │   ├── project.routes.ts
│   │   ├── task.routes.ts
│   │   └── user.routes.ts
│   ├── auth/
│   │   ├── middleware.ts
│   │   ├── password.ts
│   │   ├── permissions.ts
│   │   └── tokens.ts
│   ├── config/
│   │   ├── env.ts
│   │   └── logger.ts
│   ├── models/
│   │   └── prisma.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── dashboard.service.ts
│   │   ├── membership.service.ts
│   │   ├── project.service.ts
│   │   ├── task.service.ts
│   │   └── user.service.ts
│   ├── validations/
│   │   ├── auth.schemas.ts
│   │   ├── membership.schemas.ts
│   │   ├── project.schemas.ts
│   │   └── task.schemas.ts
│   ├── app.ts
│   └── server.ts
└── tests/
    ├── contract/
    ├── integration/
    ├── performance/
    └── unit/

frontend/
├── package.json
├── index.html
├── src/
│   ├── api/
│   │   └── client.ts
│   ├── components/
│   │   ├── dashboard/
│   │   ├── layout/
│   │   ├── projects/
│   │   ├── tasks/
│   │   └── ui/
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── ProjectDetailPage.tsx
│   │   ├── ProjectsPage.tsx
│   │   └── SignupPage.tsx
│   ├── routes/
│   │   └── AppRouter.tsx
│   ├── state/
│   │   └── auth.ts
│   ├── styles/
│   │   └── theme.css
│   └── main.tsx
└── tests/
    ├── e2e/
    └── unit/

infra/
└── railway/
    ├── deployment-notes.md
    └── smoke-test.md

docs/
├── demo-script.md
└── submission-checklist.md

scripts/
└── verify-submission.mjs

README.md
```

**Structure Decision**: Use a two-package `backend/` and `frontend/` layout to keep REST API, Prisma migrations, and frontend UI concerns separated while remaining simple enough for a single Railway-backed assignment. `infra/railway/` stores deployment notes and smoke-test evidence, while public deliverables stay in `README.md`.

## Phase 0: Research Summary

Research decisions are captured in [research.md](research.md). The resolved choices are TypeScript across the stack, React/Vite for frontend, Express REST for backend, PostgreSQL with Prisma for storage, cookie-based signed auth, and Railway PostgreSQL deployment.

## Phase 1: Design Summary

Design artifacts produced for implementation:

- [data-model.md](data-model.md) defines User, Project, Membership, Task, TaskStatus, Dashboard Summary, and Submission Artifact entities with validation and relationship rules.
- [contracts/openapi.yaml](contracts/openapi.yaml) defines auth, project, membership, task, dashboard, and health REST contracts.
- [quickstart.md](quickstart.md) defines local setup, environment variables, migrations, tests, Railway deployment, and evaluator smoke-test flow.

## Post-Design Constitution Check

- **Server-Enforced Identity & Roles**: PASS. Contracts require cookie auth for protected operations, data model names authorization boundaries, and quickstart includes RBAC smoke checks.
- **Relational Domain Integrity**: PASS. Data model describes unique membership, project-scoped assignment, status transitions, and overdue derivation; OpenAPI errors include validation and authorization failures.
- **Contract-First REST Delivery**: PASS. OpenAPI contract covers every core evaluator flow before tasks or implementation.
- **Production-Ready Railway Operation**: PASS. Quickstart includes env vars, database migration, health endpoint, Railway deployment path, and live smoke testing.
- **Evidence-Based Delivery**: PASS. Quickstart and plan define automated tests and submission artifact checks for README, live URL, GitHub repo, and demo video.

## Complexity Tracking

No constitution violations or exceptional complexity are introduced. The selected architecture is the minimum practical split for a full-stack REST application with a persistent database and Railway deployment.