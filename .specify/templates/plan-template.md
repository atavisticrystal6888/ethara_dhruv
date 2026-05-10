# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. For FSWA,
every plan MUST show how the feature preserves authentication, RBAC,
validation, REST consistency, Railway deployability, and submission evidence.

## Summary

[Extract from feature spec: primary requirement + technical approach from
research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical
  details for the feature. Keep the selected stack concrete and document any
  production-impacting unknowns as NEEDS CLARIFICATION before implementation.
-->

**Language/Version**: [e.g., TypeScript 5.x, Elixir 1.18 or NEEDS CLARIFICATION]
**Frontend**: [e.g., React, LiveView, Vue or NEEDS CLARIFICATION]
**Backend**: [e.g., Express, Phoenix, Django or NEEDS CLARIFICATION]
**Primary Dependencies**: [e.g., auth library, ORM, UI kit or NEEDS CLARIFICATION]
**Storage**: [e.g., PostgreSQL, MongoDB or NEEDS CLARIFICATION]
**Authentication**: [e.g., session cookies, JWT, OAuth or NEEDS CLARIFICATION]
**Testing**: [e.g., unit, contract, integration, e2e]
**Deployment Target**: Railway
**Project Type**: full-stack web application
**Performance Goals**: [e.g., dashboard renders in <2s, API p95 <300ms]
**Constraints**: [e.g., Admin/Member RBAC, persisted overdue logic, Railway env management]
**Scale/Scope**: [e.g., classroom demo, 100 active users, multi-project teams]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Access control is defined for every actor and privileged action, with
  server-side Admin and Member enforcement points identified.
- Data entities and relationships cover User, Project, Membership, and Task
  impacts, including validation and lifecycle constraints for this feature.
- REST contracts are identified for all impacted auth, project, task, or
  dashboard workflows, including error responses.
- Railway deployment impact is documented, including env vars, migrations or
  seed data, and live smoke-test expectations.
- Automated verification covers affected critical flows and any required README
  or demo artifact updates.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   ├── auth/
│   ├── models/
│   ├── services/
│   └── validations/
├── tests/
│   ├── contract/
│   ├── integration/
│   └── unit/
└── migrations/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── state/
└── tests/
    ├── e2e/
    └── unit/

infra/
└── railway/
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., extra service boundary] | [current need] | [why a simpler deployment or data model is insufficient] |