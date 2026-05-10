<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- template Principle 1 -> I. Server-Enforced Identity & Roles
- template Principle 2 -> II. Relational Domain Integrity
- template Principle 3 -> III. Contract-First REST Delivery
- template Principle 4 -> IV. Production-Ready Railway Operation
- template Principle 5 -> V. Evidence-Based Delivery
Added sections:
- Technology & Delivery Standards
- Development Workflow & Review Gates
Removed sections:
- None
Templates requiring updates:
- ✅ updated d:/Elixir/Assignments/Ethaara/FSWA/.specify/templates/constitution-template.md
- ✅ updated d:/Elixir/Assignments/Ethaara/FSWA/.specify/templates/checklist-template.md
- ✅ updated d:/Elixir/Assignments/Ethaara/FSWA/.specify/templates/plan-template.md
- ✅ updated d:/Elixir/Assignments/Ethaara/FSWA/.specify/templates/spec-template.md
- ✅ updated d:/Elixir/Assignments/Ethaara/FSWA/.specify/templates/tasks-template.md
- ✅ verified inherited d:/Elixir/Assignments/Ethaara/spec-kit/templates/commands/*.md
Follow-up TODOs:
- None
-->

# FSWA Team Task Manager Constitution

## Core Principles

### I. Server-Enforced Identity & Roles
The system MUST authenticate every user before access to project or task data.
Authorization MUST be enforced on the server for every privileged route and
mutation, with Admin and Member permissions defined explicitly in code, API
contracts, and tests. Client-side hiding of controls MAY improve UX, but it
never counts as access control. Rationale: the assignment requires role-based
access, and server enforcement is the only falsifiable control boundary.

### II. Relational Domain Integrity
The product MUST model Users, Projects, Memberships, and Tasks with explicit
ownership and assignment relationships. Validation rules for required fields,
task status transitions, due dates, and membership constraints MUST execute at
the API boundary and at the persistence layer where supported. Any feature that
changes task or project state MUST preserve referential integrity and reject
invalid cross-project assignments. Rationale: project, team, and task behavior
depends on correct relationships, not just UI forms.

### III. Contract-First REST Delivery
All user-facing capabilities MUST be reachable through documented REST endpoints
with stable request, response, and error shapes. Plans and specs MUST define
authentication flows, project and team management APIs, task assignment and
status APIs, and dashboard data APIs before implementation begins. Breaking
contract changes MUST update the spec, plan, tasks, and client integration in
the same change set. Rationale: the assignment explicitly requires REST APIs
plus a database-backed full-stack application.

### IV. Production-Ready Railway Operation
The application MUST run as a live Railway deployment backed by a persistent
SQL or NoSQL datastore and environment-driven configuration. Deployment
readiness MUST include database migrations or initialization, secret
management, a smoke-tested production URL, and failure handling for unavailable
services. A feature is not complete until the live Railway instance
demonstrates the intended end-to-end behavior. Rationale: deployment is
mandatory for selection, so production operation is part of the definition of
done.

### V. Evidence-Based Delivery
Every increment MUST include automated checks for the highest-risk flows:
signup and login, role enforcement, project membership, task creation,
assignment and status changes, and overdue dashboard calculations. Submission
readiness MUST also include an updated README, a public repository state that
matches the deployed build, and a 2-5 minute demo video plan or script that
covers the live application. Rationale: the deliverables are evaluated as a
package, so quality evidence must cover behavior and submission artifacts.

## Technology & Delivery Standards

- The project MUST be a full-stack web application with a frontend, REST
  backend, and persistent database.
- The stack MAY be any framework mix that Railway can deploy reliably, but the
  selected stack MUST support authentication, RBAC, data validation, and
  database relationships without custom security shortcuts.
- The dashboard MUST expose task status breakdowns and overdue visibility from
  persisted data, not mocked client-side calculations alone.
- The README MUST document local setup, required environment variables,
  database setup, Railway deployment steps, the live URL, and the demo video
  link or placeholder.
- The repository MUST keep deployment and runtime configuration reproducible by
  another developer without undocumented manual steps.

## Development Workflow & Review Gates

- Feature specs MUST identify actors, roles, entities, API surfaces,
  validation rules, and delivery artifacts before planning closes.
- Implementation plans MUST record the selected database, deployment topology,
  RBAC enforcement points, validation strategy, and test scope for critical
  flows.
- Task breakdowns MUST include database and schema work, auth and RBAC work,
  REST contract work, dashboard work, deployment work, and submission
  documentation work when those areas change.
- Code review or self-review MUST reject work that lacks server-side
  authorization checks, skips validation for persisted inputs, or cannot be
  exercised on Railway.
- Before submission, the team MUST perform a live smoke test covering signup
  and login, project creation, task assignment, status updates, overdue
  visibility, and role-restricted actions.

## Governance

- This constitution overrides conflicting local workflow notes for FSWA. Specs,
  plans, tasks, and implementation reviews MUST cite or satisfy these
  principles.
- Amendments MUST be made in the same change set as any affected template or
  workflow update, and the Sync Impact Report at the top of this file MUST be
  refreshed.
- Versioning policy: MAJOR for removed or redefined principles, MINOR for new
  principles or materially expanded governance, PATCH for clarifications that
  do not change obligations.
- Compliance review is REQUIRED at three points: constitution update, plan
  approval, and pre-submission verification against the live Railway deployment
  and repository deliverables.
- Any unresolved conflict between delivery pressure and this constitution
  defaults in favor of security, data integrity, and deployable completeness.

**Version**: 1.0.0 | **Ratified**: 2026-05-10 | **Last Amended**: 2026-05-10