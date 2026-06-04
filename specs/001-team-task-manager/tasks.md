---
description: "Tasks for Team Task Manager implementation"
---

# Tasks: Team Task Manager

**Input**: Design documents from `/specs/001-team-task-manager/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Tests**: Automated tests are required for critical auth, RBAC, validation, task lifecycle, dashboard, responsive UI, and deployment smoke flows because the constitution requires evidence-based delivery.

**Organization**: Tasks are grouped by user story so each increment can be implemented and tested independently after shared foundation work is complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and does not depend on incomplete tasks
- **[Story]**: User story label for traceability, required only in user story phases
- Every task includes an exact file or directory path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the full-stack workspace, package scripts, test runners, and deployment scaffolding.

- [X] T001 Create workspace package manifests in package.json, backend/package.json, and frontend/package.json
- [X] T002 Create TypeScript project configuration in tsconfig.json, backend/tsconfig.json, and frontend/tsconfig.json
- [X] T003 [P] Configure backend linting and test runner in backend/eslint.config.js and backend/vitest.config.ts
- [X] T004 [P] Configure frontend Vite, linting, Vitest, and Playwright in frontend/vite.config.ts, frontend/eslint.config.js, frontend/vitest.config.ts, and frontend/playwright.config.ts
- [X] T005 Create environment examples in backend/.env.example and frontend/.env.example
- [X] T006 [P] Create planned source and infra directories with entry files in backend/src/app.ts, backend/src/server.ts, frontend/src/main.tsx, frontend/src/routes/AppRouter.tsx, and infra/railway/deployment-notes.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the shared database, API, authentication, frontend shell, and test foundation required by every story.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T007 Define the relational database schema for User, Project, Membership, Task, role, and status models
- [X] T008 Create the initial SQL migration for users, projects, memberships, tasks, constraints, and indexes in backend/db/migrations/001_init.sql
- [X] T009 [P] Implement the shared database client singleton in backend/src/models/database.ts
- [X] T010 [P] Implement environment validation and runtime config in backend/src/config/env.ts
- [X] T011 [P] Implement shared API error, not-found, and Zod validation middleware in backend/src/api/middleware/error.ts and backend/src/api/middleware/validate.ts
- [X] T012 Wire Express app, JSON parsing, security middleware, CORS, cookies, and route mounting in backend/src/app.ts and backend/src/server.ts
- [X] T013 [P] Implement password hashing and signed token helpers in backend/src/auth/password.ts and backend/src/auth/tokens.ts
- [X] T014 [P] Implement authentication middleware and permission helpers in backend/src/auth/middleware.ts and backend/src/auth/permissions.ts
- [X] T015 [P] Implement frontend API client base with credentialed requests and normalized errors in frontend/src/api/client.ts
- [X] T016 [P] Implement frontend auth state shell in frontend/src/state/auth.ts
- [X] T017 [P] Implement protected route and app router shell in frontend/src/routes/AppRouter.tsx
- [X] T018 [P] Create shared UI primitives for buttons, fields, loading, empty, and error states in frontend/src/components/ui/Button.tsx, frontend/src/components/ui/FormField.tsx, frontend/src/components/ui/LoadingState.tsx, frontend/src/components/ui/EmptyState.tsx, and frontend/src/components/ui/ErrorAlert.tsx
- [X] T019 [P] Implement health route and structured logger setup in backend/src/api/health.routes.ts and backend/src/config/logger.ts
- [X] T020 [P] Create backend test database helpers and test setup in backend/tests/helpers/testDatabase.ts and backend/tests/setup.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel where task dependencies allow.

---

## Phase 3: User Story 1 - Establish Secure Team Workspace (Priority: P1) MVP

**Goal**: Users can sign up or log in, first user becomes Admin, Admin can create a project and add a Member, and Members are denied Admin-only membership actions.

**Independent Test**: Create Admin and Member accounts, create a project, add the Member, log in as both roles, and verify Member cannot manage project membership.

### Tests for User Story 1

- [X] T021 [P] [US1] Add auth REST contract tests for signup, login, logout, and me endpoints in backend/tests/contract/auth.contract.test.ts
- [X] T022 [P] [US1] Add project, membership, and user lookup REST contract tests in backend/tests/contract/projects-memberships.contract.test.ts
- [X] T023 [P] [US1] Add first-Admin bootstrap and Admin/Member RBAC integration tests in backend/tests/integration/auth-rbac.integration.test.ts
- [X] T024 [P] [US1] Add secure workspace browser flow test in frontend/tests/e2e/secure-workspace.spec.ts

### Implementation for User Story 1

- [X] T025 [P] [US1] Implement auth request and response schemas in backend/src/validations/auth.schemas.ts
- [X] T026 [P] [US1] Implement project and membership request schemas in backend/src/validations/project.schemas.ts and backend/src/validations/membership.schemas.ts
- [X] T027 [US1] Implement signup, login, logout, current user, and first-Admin bootstrap logic in backend/src/services/auth.service.ts
- [X] T028 [US1] Implement auth routes and cookie handling in backend/src/api/auth.routes.ts
- [X] T029 [US1] Implement Admin-scoped project creation, listing, update, and delete logic in backend/src/services/project.service.ts
- [X] T030 [US1] Implement membership add, list, remove, duplicate membership, and active-task removal blocking rules in backend/src/services/membership.service.ts
- [X] T031 [US1] Implement project and membership REST routes in backend/src/api/project.routes.ts and backend/src/api/membership.routes.ts
- [X] T032 [US1] Implement Admin-only user lookup REST route and service in backend/src/api/user.routes.ts and backend/src/services/user.service.ts
- [X] T033 [P] [US1] Add member search and selection UI in frontend/src/components/projects/MemberSearch.tsx
- [X] T034 [P] [US1] Implement signup and login pages in frontend/src/pages/SignupPage.tsx and frontend/src/pages/LoginPage.tsx
- [X] T035 [P] [US1] Implement project list, detail shell, project form, and member panel in frontend/src/pages/ProjectsPage.tsx, frontend/src/pages/ProjectDetailPage.tsx, frontend/src/components/projects/ProjectForm.tsx, and frontend/src/components/projects/MembersPanel.tsx
- [X] T036 [US1] Connect auth, project, user lookup, and membership frontend flows to the REST API in frontend/src/api/client.ts and frontend/src/state/auth.ts
- [X] T037 [US1] Add unauthorized, duplicate, validation, loading, and empty-state UI behavior for workspace flows in frontend/src/pages/ProjectsPage.tsx and frontend/src/pages/ProjectDetailPage.tsx

**Checkpoint**: User Story 1 is a working MVP for authentication, project setup, team membership, and role restrictions.

---

## Phase 4: User Story 2 - Manage Tasks and Assignments (Priority: P2)

**Goal**: Admins can create and assign tasks inside projects, and Members can update allowed task status for tasks assigned to them.

**Independent Test**: With an Admin, Member, and project available, create valid and invalid tasks, assign a task to a Member, update status as Member, and verify cross-project assignment is rejected.

### Tests for User Story 2

- [X] T038 [P] [US2] Add task REST contract tests for list, create, get, update, and delete endpoints in backend/tests/contract/tasks.contract.test.ts
- [X] T039 [P] [US2] Add task assignment, cross-project validation, and status permission integration tests in backend/tests/integration/tasks.integration.test.ts
- [X] T040 [P] [US2] Add task management browser flow test in frontend/tests/e2e/task-management.spec.ts

### Implementation for User Story 2

- [X] T041 [P] [US2] Implement task create and update request schemas in backend/src/validations/task.schemas.ts
- [X] T042 [US2] Implement task creation, assignment validation, status transitions, overdue derivation, and delete logic in backend/src/services/task.service.ts
- [X] T043 [US2] Implement project task REST routes in backend/src/api/task.routes.ts
- [X] T044 [P] [US2] Implement task form, task list, and status badge components in frontend/src/components/tasks/TaskForm.tsx, frontend/src/components/tasks/TaskList.tsx, and frontend/src/components/tasks/StatusBadge.tsx
- [X] T045 [US2] Integrate task list, task form, and status update flows into frontend/src/pages/ProjectDetailPage.tsx
- [X] T046 [US2] Enforce assigned-Member status-only permissions in backend/src/auth/permissions.ts and backend/src/services/task.service.ts
- [X] T047 [US2] Add task field validation messages, duplicate-submit protection, and request-state feedback in frontend/src/components/tasks/TaskForm.tsx and frontend/src/components/tasks/TaskList.tsx

**Checkpoint**: User Story 2 works independently with project-scoped task assignment and status tracking.

---

## Phase 5: User Story 3 - Track Progress on Dashboard (Priority: P3)

**Goal**: Authenticated users can see role-scoped dashboard summaries for accessible projects, task totals, status breakdowns, assigned work, and overdue tasks.

**Independent Test**: Create tasks across statuses and due dates, log in as Admin and Member, and verify each dashboard count matches only the data visible to that role.

### Tests for User Story 3

- [X] T048 [P] [US3] Add dashboard REST contract tests in backend/tests/contract/dashboard.contract.test.ts
- [X] T049 [P] [US3] Add dashboard count, overdue, and role-scope integration tests in backend/tests/integration/dashboard.integration.test.ts
- [X] T050 [P] [US3] Add dashboard browser flow test in frontend/tests/e2e/dashboard.spec.ts

### Implementation for User Story 3

- [X] T051 [US3] Implement role-scoped dashboard aggregation and overdue calculations in backend/src/services/dashboard.service.ts
- [X] T052 [US3] Implement dashboard REST route in backend/src/api/dashboard.routes.ts
- [X] T053 [P] [US3] Implement dashboard summary components in frontend/src/components/dashboard/SummaryCards.tsx, frontend/src/components/dashboard/StatusBreakdown.tsx, and frontend/src/components/dashboard/ProjectProgressList.tsx
- [X] T054 [US3] Implement dashboard page queries, loading, empty, and error states in frontend/src/pages/DashboardPage.tsx
- [X] T055 [US3] Add dashboard navigation and default authenticated landing behavior in frontend/src/routes/AppRouter.tsx and frontend/src/components/layout/AppShell.tsx

**Checkpoint**: User Story 3 shows accurate progress data from persisted records for both Admin and Member users.

---

## Phase 6: User Story 4 - Use a Polished Responsive Interface (Priority: P4)

**Goal**: The app is visually professional, responsive, readable, consistent, and resilient across core loading, empty, validation, and error states.

**Independent Test**: Complete the main flows at desktop and mobile widths and verify no overlap, horizontal scrolling, hidden primary actions, unclear status indicators, or missing request states.

### Tests for User Story 4

- [X] T056 [P] [US4] Add responsive and visual-state browser checks in frontend/tests/e2e/responsive-polish.spec.ts
- [X] T057 [P] [US4] Add UI state unit tests for loading, empty, error, and field validation components in frontend/tests/unit/ui-states.test.tsx

### Implementation for User Story 4

- [X] T058 [P] [US4] Define typography, spacing, layout, and status color tokens in frontend/src/styles/theme.css
- [X] T059 [P] [US4] Implement application shell, navigation, and responsive content frame in frontend/src/components/layout/AppShell.tsx
- [X] T060 [P] [US4] Finalize reusable empty, loading, error, and form field components in frontend/src/components/ui/EmptyState.tsx, frontend/src/components/ui/LoadingState.tsx, frontend/src/components/ui/ErrorAlert.tsx, and frontend/src/components/ui/FormField.tsx
- [X] T061 [US4] Apply responsive layouts to frontend/src/pages/DashboardPage.tsx, frontend/src/pages/ProjectsPage.tsx, and frontend/src/pages/ProjectDetailPage.tsx
- [X] T062 [US4] Add accessible labels, focus handling, and disabled submission states in frontend/src/pages/LoginPage.tsx, frontend/src/pages/SignupPage.tsx, frontend/src/components/projects/ProjectForm.tsx, and frontend/src/components/tasks/TaskForm.tsx
- [X] T063 [US4] Polish consistent To Do, In Progress, Done, and Overdue status presentation in frontend/src/components/tasks/StatusBadge.tsx and frontend/src/components/dashboard/StatusBreakdown.tsx

**Checkpoint**: User Story 4 satisfies the frontend and visual evaluation criteria across desktop and mobile.

---

## Phase 7: User Story 5 - Submit a Complete Live Assignment (Priority: P5)

**Goal**: The evaluator can use the Railway live URL, GitHub repo, README, and 2-5 minute demo video to verify the complete app without private instructions.

**Independent Test**: Follow only README, live URL, repository contents, and demo script to complete the smoke flow from signup through dashboard review.

### Tests for User Story 5

- [X] T064 [P] [US5] Add live-submission smoke browser test in frontend/tests/e2e/submission-smoke.spec.ts
- [X] T065 [P] [US5] Add README and submission artifact verification script in scripts/verify-submission.mjs

### Implementation for User Story 5

- [X] T066 [US5] Document Railway backend service, frontend service, PostgreSQL service, env vars, migration command, and rollback notes in infra/railway/deployment-notes.md
- [X] T067 [US5] Document production smoke-test steps and expected evidence in infra/railway/smoke-test.md
- [X] T068 [US5] Add backend production start, migration, and health-check scripts in backend/package.json
- [X] T069 [US5] Add frontend Railway production build and deployed API base URL configuration in frontend/package.json and frontend/vite.config.ts
- [X] T070 [US5] Write README overview, setup, env vars, database, Railway deployment, live URL, and demo sections in README.md
- [X] T071 [US5] Draft the 2-5 minute walkthrough script in docs/demo-script.md
- [X] T072 [US5] Create final submission checklist with live URL, repo, README, and video fields in docs/submission-checklist.md

**Checkpoint**: User Story 5 has all submission artifacts and can be verified from the live Railway deployment.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final quality work spanning multiple stories after the desired increments are complete.

- [X] T073 [P] Run the complete backend test suite and fix task-linked failures in backend/tests/
- [X] T074 [P] Run the complete frontend unit and e2e test suites and fix task-linked failures in frontend/tests/
- [X] T075 [P] Reconcile implemented response shapes with the REST contract in specs/001-team-task-manager/contracts/openapi.yaml
- [ ] T076 Verify quickstart commands and Railway smoke flow in specs/001-team-task-manager/quickstart.md and infra/railway/smoke-test.md
- [ ] T077 Audit security, RBAC, validation, and deployment readiness against specs/001-team-task-manager/plan.md and FSWA/.specify/memory/constitution.md
- [X] T078 [P] Add performance smoke checks for 300 ms p95 dashboard/project/task API responses and 2 second first meaningful UI view in backend/tests/performance/api-performance.test.ts and frontend/tests/e2e/performance-smoke.spec.ts
- [X] T079 Run final formatting and cleanup across backend/src/, frontend/src/, README.md, and docs/

---

## Phase 9: User Story 6 - Operate From A Work-First Workspace (Priority: P1 Uplift)

**Goal**: Replace the presentation-first shell with a denser project workspace that keeps board views, team context, and issue creation in one operating surface.

**Independent Test**: Open a project, switch between Summary, Board, and Team tabs, filter the board, toggle quick-create, and confirm the shell remains usable at desktop and mobile widths.

### Tests for User Story 6

- [X] T080 [P] [US6] Add workspace shell, project tab, and board-toolbar coverage in frontend/tests/unit/project-workspace.test.tsx and the existing frontend/tests/e2e/dashboard.spec.ts and frontend/tests/e2e/submission-smoke.spec.ts flows

### Implementation for User Story 6

- [X] T081 [US6] Implement route-aware top bar and denser shell navigation in frontend/src/components/layout/AppShell.tsx and frontend/src/components/layout/TopBar.tsx
- [X] T082 [US6] Implement project tabs and board toolbar in frontend/src/components/layout/ProjectTabs.tsx, frontend/src/components/tasks/BoardToolbar.tsx, and frontend/src/pages/ProjectDetailPage.tsx
- [X] T083 [US6] Refine dense workspace tokens and responsive behavior in frontend/src/styles/theme.css
- [X] T084 [US6] Convert issue creation into a toggleable workspace panel in frontend/src/components/tasks/TaskForm.tsx and frontend/src/pages/ProjectDetailPage.tsx
- [X] T085 [US6] Rebalance dashboard and projects entry copy toward work-first scanning in frontend/src/pages/DashboardPage.tsx and frontend/src/pages/ProjectsPage.tsx

**Checkpoint**: Project work happens through a denser shell with tabs, quick-create, and board-level controls instead of one long mixed page.

---

## Phase 10: User Story 7 - Expand Tasks Into Rich Issues (Priority: P2 Uplift)

**Goal**: Add issue metadata needed for triage and planning, including issue type, priority, reporter, story points, and stable ordering.

**Independent Test**: Create issues with metadata, reload the project, and verify type, priority, reporter, points, and ordering persist and round-trip through the API.

### Tests for User Story 7

- [ ] T086 [P] [US7] Add contract coverage for issue metadata in backend/tests/contract/tasks.contract.test.ts and backend/tests/contract/dashboard.contract.test.ts
- [ ] T087 [P] [US7] Add issue metadata persistence and filtering tests in backend/tests/integration/tasks.integration.test.ts and frontend/tests/e2e/task-management.spec.ts

### Implementation for User Story 7

- [X] T088 [US7] Add issue metadata schema and migration support in backend/db/migrations/003_issue_metadata.sql, backend/src/types/domain.ts, and backend/src/types/database.ts
- [X] T089 [US7] Extend task validation, serialization, and service rules for issue metadata in backend/src/validations/task.schemas.ts, backend/src/services/task.service.ts, and backend/src/services/serializers.ts
- [X] T090 [US7] Persist issue metadata across database adapters in backend/src/models/postgresDatabase.ts, backend/src/models/memoryDatabase.ts, and backend/src/models/memoryPrisma.ts
- [X] T091 [US7] Expand frontend API types and issue editing fields in frontend/src/api/client.ts, frontend/src/components/tasks/TaskForm.tsx, and frontend/src/pages/ProjectDetailPage.tsx
- [X] T092 [US7] Implement priority and issue-type visual badges in frontend/src/components/tasks/PriorityBadge.tsx, frontend/src/components/tasks/IssueTypeBadge.tsx, frontend/src/components/tasks/TaskList.tsx, and frontend/src/components/tasks/TaskViews.tsx

**Checkpoint**: Every task behaves more like a delivery issue with stronger triage context.

---

## Phase 11: User Story 8 - Add Backlog, Sprint, and Ordering Flows (Priority: P3 Uplift)

**Goal**: Support backlog grooming, sprint assignment, and board ordering instead of read-only planning views.

**Independent Test**: Reorder backlog issues, move work into a sprint, change issue order, and verify the order remains stable after refresh.

### Tests for User Story 8

- [X] T093 [P] [US8] Add backlog and sprint browser flow coverage in the existing frontend/tests/e2e/task-management.spec.ts flow
- [X] T094 [P] [US8] Add toolbar filter and ordering state unit coverage in frontend/tests/unit/project-workspace.test.tsx

### Implementation for User Story 8

- [X] T095 [US8] Add task query and ordering support to REST routes in backend/src/api/task.routes.ts, backend/src/services/task.service.ts, and frontend/src/api/client.ts
- [X] T096 [US8] Implement backlog and planning views in frontend/src/components/tasks/BacklogView.tsx and frontend/src/pages/ProjectDetailPage.tsx
- [X] T097 [US8] Add sprint persistence and lifecycle support in backend/db/migrations/004_sprints.sql, backend/src/api/sprint.routes.ts, backend/src/services/sprint.service.ts, and backend/src/models/postgresDatabase.ts
- [X] T098 [US8] Implement board and backlog ordering interactions in frontend/src/components/tasks/TaskViews.tsx and frontend/src/components/tasks/BacklogView.tsx

**Checkpoint**: Planning moves from static views to backlog and sprint management.

---

## Phase 12: User Story 9 - Add Issue Collaboration and Activity (Priority: P4 Uplift)

**Goal**: Make each issue a collaboration object with comments and change history.

**Independent Test**: Open an issue, add a comment, update status or assignee, and verify the comment and activity history are shown in the issue context.

### Tests for User Story 9

- [X] T099 [P] [US9] Add contract and integration coverage for comments and activity history in backend/tests/contract/task-collaboration.contract.test.ts and backend/tests/integration/task-collaboration.integration.test.ts

### Implementation for User Story 9

- [X] T100 [US9] Add comment and activity persistence in backend/db/migrations/005_task_collaboration.sql, backend/src/models/postgresDatabase.ts, and backend/src/services/task.service.ts
- [X] T101 [US9] Expose comment and activity endpoints in backend/src/api/task.routes.ts and frontend/src/api/client.ts
- [X] T102 [US9] Implement issue detail, comment thread, and activity feed UI in frontend/src/components/tasks/TaskDetailPanel.tsx and frontend/src/pages/ProjectDetailPage.tsx

**Checkpoint**: Users can discuss work and inspect recent issue history without leaving the app.

---

## Phase 13: User Story 10 - Harden The Upgraded Workspace (Priority: P5 Uplift)

**Goal**: Finish the Jira-inspired uplift with improved work surfaces, docs, and end-to-end validation.

**Independent Test**: From the live or local app, navigate dashboard to project workspace, filter issues, create and edit issues, move planning state, and confirm the upgraded flows remain responsive and documented.

### Tests for User Story 10

- [X] T103 [P] [US10] Add full upgraded-workspace smoke coverage in the existing frontend/tests/e2e/dashboard.spec.ts, frontend/tests/e2e/submission-smoke.spec.ts, and frontend/tests/e2e/responsive-polish.spec.ts flows

### Implementation for User Story 10

- [X] T104 [US10] Rebalance dashboard and add a personal work surface in frontend/src/pages/DashboardPage.tsx, frontend/src/components/dashboard/SummaryCards.tsx, frontend/src/components/dashboard/ProjectProgressList.tsx, frontend/src/components/dashboard/WorkloadReport.tsx, and frontend/src/pages/YourWorkPage.tsx
- [X] T105 [US10] Update README, demo script, and submission checklist for the upgraded workspace in README.md, docs/demo-script.md, and docs/submission-checklist.md
- [X] T106 [US10] Run final upgraded-workspace validation across backend/tests/, frontend/tests/, specs/001-team-task-manager/quickstart.md, and infra/railway/smoke-test.md

**Checkpoint**: The upgraded workspace is validated, documented, and demo-ready.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: No dependencies, start immediately.
- **Phase 2 Foundational**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 User Story 1**: Depends on Phase 2 and forms the MVP.
- **Phase 4 User Story 2**: Depends on Phase 2, and uses the authenticated project/member context from User Story 1 for end-to-end validation.
- **Phase 5 User Story 3**: Depends on Phase 2, and is most meaningful after task data from User Story 2 exists.
- **Phase 6 User Story 4**: Depends on Phase 2 and can run alongside story implementation once pages/components exist.
- **Phase 7 User Story 5**: Depends on completed target stories and final deployment readiness.
- **Phase 8 Polish**: Depends on all desired user stories being complete.
- **Phase 9 User Story 6**: Depends on the existing shipped workspace and begins the Jira-inspired UX uplift on the current frontend shell.
- **Phase 10 User Story 7**: Depends on Phase 9 workspace surfaces so richer issue metadata has places to live.
- **Phase 11 User Story 8**: Depends on Phase 10 issue metadata and ordering fields.
- **Phase 12 User Story 9**: Depends on Phase 10 issue context and benefits from Phase 11 detail surfaces.
- **Phase 13 User Story 10**: Depends on completion of the uplift phases and closes with validation and delivery updates.

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational. No dependency on other stories. Suggested MVP.
- **US2 (P2)**: Starts after Foundational. Requires project and membership capabilities for full end-to-end validation.
- **US3 (P3)**: Starts after Foundational. Dashboard implementation can begin independently, but validation needs project/task records.
- **US4 (P4)**: Starts after Foundational. Can proceed in parallel with UI-heavy tasks in US1-US3.
- **US5 (P5)**: Starts after target app functionality is complete enough for deployment and demo evidence.
- **US6 (P1 uplift)**: Starts after the original app is stable and restructures the day-to-day workspace UX.
- **US7 (P2 uplift)**: Starts after US6 and adds richer issue metadata.
- **US8 (P3 uplift)**: Starts after US7 to enable backlog and sprint planning.
- **US9 (P4 uplift)**: Starts after US7 and integrates best after issue detail surfaces exist.
- **US10 (P5 uplift)**: Starts after the uplift functionality is complete enough for final validation and docs.

### Within Each User Story

- Tests must be written first and should fail before implementation.
- Validation schemas before services.
- Services before REST routes.
- Backend capability before frontend integration.
- UI state handling before story checkpoint validation.

### Parallel Opportunities

- T003, T004, and T006 can run in parallel after package manifest decisions.
- T009-T011, T013-T020 can run in parallel once database and app structure are started.
- Contract, integration, and e2e tests within each story can run in parallel.
- Frontend component work marked [P] can run alongside backend schema and service work for the same story after contracts are understood.
- US4 visual polish can overlap with US1-US3 page/component work after the foundational frontend shell exists.

---

## Parallel Examples

### User Story 1

```text
Task T021: Add auth REST contract tests in backend/tests/contract/auth.contract.test.ts
Task T022: Add project, membership, and user lookup REST contract tests in backend/tests/contract/projects-memberships.contract.test.ts
Task T023: Add RBAC integration tests in backend/tests/integration/auth-rbac.integration.test.ts
Task T024: Add secure workspace e2e flow in frontend/tests/e2e/secure-workspace.spec.ts
Task T033: Add member search and selection UI in frontend/src/components/projects/MemberSearch.tsx
```

### User Story 2

```text
Task T038: Add task REST contract tests in backend/tests/contract/tasks.contract.test.ts
Task T039: Add task integration tests in backend/tests/integration/tasks.integration.test.ts
Task T040: Add task browser flow in frontend/tests/e2e/task-management.spec.ts
Task T044: Implement task UI components in frontend/src/components/tasks/
```

### User Story 3

```text
Task T048: Add dashboard REST contract tests in backend/tests/contract/dashboard.contract.test.ts
Task T049: Add dashboard integration tests in backend/tests/integration/dashboard.integration.test.ts
Task T050: Add dashboard browser flow in frontend/tests/e2e/dashboard.spec.ts
Task T053: Implement dashboard components in frontend/src/components/dashboard/
```

### User Story 4

```text
Task T056: Add responsive e2e checks in frontend/tests/e2e/responsive-polish.spec.ts
Task T057: Add UI state unit tests in frontend/tests/unit/ui-states.test.tsx
Task T058: Define theme tokens in frontend/src/styles/theme.css
Task T059: Implement app shell in frontend/src/components/layout/AppShell.tsx
```

### User Story 5

```text
Task T064: Add live-submission smoke e2e test in frontend/tests/e2e/submission-smoke.spec.ts
Task T065: Add artifact verification script in scripts/verify-submission.mjs
Task T066: Document Railway setup in infra/railway/deployment-notes.md
Task T067: Document smoke testing in infra/railway/smoke-test.md
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Stop and validate signup, login, first Admin, project creation, member assignment, and Member denial independently.
5. Deploy the MVP if Railway setup is ready.

### Incremental Delivery

1. Add User Story 1 for secure workspace MVP.
2. Add User Story 2 for task creation, assignment, and status tracking.
3. Add User Story 3 for dashboard summaries and progress visibility.
4. Add User Story 4 for polished responsive UX.
5. Add User Story 5 for Railway and submission completeness.
6. Add User Story 6 for a work-first shell and project workspace.
7. Add User Story 7 for richer issue metadata.
8. Add User Story 8 for backlog and sprint planning.
9. Add User Story 9 for comments and activity history.
10. Add User Story 10 for upgraded-workspace hardening.

### Parallel Team Strategy

1. Team completes setup and foundational work together.
2. Backend-focused developer handles services, routes, the database layer, and backend tests.
3. Frontend-focused developer handles pages, components, query states, and e2e tests.
4. Deployment/documentation-focused developer handles Railway, README, smoke tests, and demo artifacts after deployable slices exist.

---

## Task Summary

- **Total tasks**: 106
- **Setup tasks**: 6
- **Foundational tasks**: 14
- **US1 Secure Team Workspace**: 17
- **US2 Task Management**: 10
- **US3 Dashboard Progress**: 8
- **US4 Responsive Polish**: 8
- **US5 Live Submission**: 9
- **Polish tasks**: 7
- **US6 Work-First Workspace**: 6
- **US7 Rich Issue Model**: 7
- **US8 Backlog and Sprint Planning**: 6
- **US9 Collaboration and Activity**: 4
- **US10 Upgrade Hardening**: 4

## Independent Test Criteria

- **US1**: Admin and Member accounts can authenticate; Admin creates project and adds Member; Member cannot perform Admin-only membership actions.
- **US2**: Admin creates and assigns tasks; invalid task and cross-project assignment are rejected; assigned Member can update allowed status only.
- **US3**: Admin and Member dashboards show correct role-scoped totals, status counts, assigned work, and overdue counts from persisted data.
- **US4**: Core flows work at desktop and mobile widths with clear loading, empty, validation, and error states.
- **US5**: README, Railway live URL, GitHub repo, smoke-test evidence, and 2-5 minute demo script support evaluator verification without private instructions.

## Format Validation

All task entries follow the required checklist format: `- [ ] T### [P?] [US?] Description with file path`.