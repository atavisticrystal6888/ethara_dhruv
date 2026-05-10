# Research: Team Task Manager

## Decision: Use TypeScript across frontend and backend

**Rationale**: A shared language reduces assignment complexity, improves validation/schema reuse, and gives strong editor support for REST payloads, domain entities, and tests.

**Alternatives considered**: JavaScript only was faster to start but weaker for contract drift. Elixir/Phoenix was production-ready but adds a steeper setup burden for a typical full-stack assignment. Python/Django was viable but would split language context between backend and frontend.

## Decision: Use React 18 with Vite for the frontend

**Rationale**: React with Vite is lightweight, widely deployable, fast to iterate, and supports a polished responsive dashboard with predictable component structure. TanStack Query handles REST request loading, error, cache, and refetch states cleanly.

**Alternatives considered**: Next.js provides full-stack features but is unnecessary when the assignment explicitly needs a REST backend. Vue is equally viable but less likely to share existing component/test patterns with common TypeScript backend tooling.

## Decision: Use Express 5 for the REST backend

**Rationale**: Express keeps the API layer explicit and easy to map to OpenAPI, Supertest, and Railway deployment. A route/service/validation/authorization structure keeps the backend understandable for evaluators.

**Alternatives considered**: NestJS offers stronger structure but adds framework overhead. Fastify is performant but less familiar to many reviewers. Serverless functions complicate RBAC and database connection handling for a small assignment.

## Decision: Use PostgreSQL with Prisma

**Rationale**: The domain is relationship-heavy: users, projects, memberships, task assignees, task creators, statuses, and dashboard counts. PostgreSQL enforces relational integrity, and Railway has first-class PostgreSQL support. Prisma migrations and generated types make schema evolution and local setup reproducible.

**Alternatives considered**: MongoDB can satisfy NoSQL persistence but would require more custom relationship enforcement. SQLite is excellent locally but not the best fit for mandatory Railway production deployment. Raw SQL avoids ORM abstraction but slows development and increases boilerplate.

## Decision: Use secure HTTP-only cookie authentication with signed tokens

**Rationale**: Browser-based task management benefits from cookies that are not readable by client JavaScript. Signed short-lived tokens keep the API stateless for Railway deployment while preserving server-side permission checks for every protected action.

**Alternatives considered**: LocalStorage bearer tokens are easier but expose tokens to XSS impact. Server-side sessions are strong but require additional session storage and cleanup. OAuth is outside the assignment scope.

## Decision: Enforce RBAC in backend middleware plus service-level project checks

**Rationale**: Global role checks alone are insufficient because Members should access only projects where they have membership. Middleware authenticates users and routes Admin-only operations, while service-level guards verify project membership, task assignment, and project scope.

**Alternatives considered**: Client-only control hiding was rejected by the constitution. Database-only permissions would be harder to express and test in a small application. Per-route inline checks would be repetitive and easy to miss.

## Decision: Use Zod validation at REST boundaries

**Rationale**: Zod produces explicit request schemas, field-specific validation errors, and reusable TypeScript types. This directly supports the rubric items for validations, error states, and REST error consistency.

**Alternatives considered**: Manual validation is error-prone. Joi is mature but less TypeScript-native. Prisma validation alone cannot produce user-friendly API validation responses for every input case.

## Decision: Use Vitest, Supertest, and Playwright for evidence-based delivery

**Rationale**: Vitest covers pure domain and validation rules, Supertest covers REST contracts and authorization, and Playwright covers high-risk UI flows, responsiveness, and loading/error behavior. Together they map to frontend, backend, and visual evaluation criteria.

**Alternatives considered**: Jest is viable but slower to configure in Vite projects. Cypress is strong for UI but Playwright has better multi-viewport support and straightforward CI usage. Manual testing alone fails the constitution's evidence requirements.

## Decision: Deploy on Railway with PostgreSQL, environment variables, and smoke tests

**Rationale**: Railway is mandatory for selection. Keeping deployment configuration environment-driven and documented makes the live URL reproducible and evaluable without private setup. A health endpoint and smoke-test checklist reduce submission risk.

**Alternatives considered**: Render, Vercel, or Netlify do not satisfy the mandatory Railway requirement. Local-only demos are non-compliant. Docker can be added later but is not required for the first Railway deployment.