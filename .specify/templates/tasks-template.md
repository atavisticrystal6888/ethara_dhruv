---
description: "Task list template for Team Task Manager implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Automated tests are EXPECTED for any story that changes
authentication, authorization, persisted validation, task lifecycle,
dashboard logic, or deployment-critical behavior.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Full-stack web app**: `backend/`, `frontend/`, and optional `infra/` at repository root
- **Tests**: `backend/tests/`, `frontend/tests/`, and end-to-end paths defined in plan.md
- Paths shown below assume a backend and frontend split - adjust only if the plan documents a different structure

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Tasks MUST stay organized by user story so each story can be implemented,
  tested, deployed, and demonstrated independently.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and environment scaffolding

- [ ] T001 Create backend, frontend, and infra structure per implementation plan
- [ ] T002 Initialize project dependencies and shared environment configuration
- [ ] T003 [P] Configure linting, formatting, and test runners
- [ ] T004 [P] Configure Railway service, build, and environment variable scaffolding

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create database schema, migrations, and seed strategy
- [ ] T006 [P] Implement authentication and session or token handling in backend/src/auth/
- [ ] T007 [P] Implement Admin and Member authorization middleware or policies in backend/src/auth/
- [ ] T008 [P] Set up API routing, request validation, and error handling in backend/src/api/
- [ ] T009 Create core User, Project, Membership, and Task models in backend/src/models/
- [ ] T010 [P] Set up frontend auth state, route protection, and API client integration in frontend/src/
- [ ] T011 [P] Configure logging, monitoring hooks, and smoke-test support for Railway deployment

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1

> **NOTE: Critical flow tests MUST fail before implementation begins**

- [ ] T012 [P] [US1] Add contract test for the impacted REST endpoint in backend/tests/contract/test_[name].py
- [ ] T013 [P] [US1] Add integration or e2e test for the user journey in backend/tests/integration/test_[name].py or frontend/tests/e2e/[name].spec.ts

### Implementation for User Story 1

- [ ] T014 [P] [US1] Create or update supporting models in backend/src/models/
- [ ] T015 [P] [US1] Implement service logic in backend/src/services/
- [ ] T016 [US1] Implement REST endpoint or handler in backend/src/api/
- [ ] T017 [US1] Implement frontend flow in frontend/src/pages/ or frontend/src/components/
- [ ] T018 [US1] Add validation, authorization, and error handling for the story

**Checkpoint**: User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2

- [ ] T019 [P] [US2] Add contract test for the impacted REST endpoint in backend/tests/contract/test_[name].py
- [ ] T020 [P] [US2] Add integration or e2e test for the user journey in backend/tests/integration/test_[name].py or frontend/tests/e2e/[name].spec.ts

### Implementation for User Story 2

- [ ] T021 [P] [US2] Create or update supporting models in backend/src/models/
- [ ] T022 [US2] Implement service logic in backend/src/services/
- [ ] T023 [US2] Implement REST endpoint or handler in backend/src/api/
- [ ] T024 [US2] Implement frontend flow in frontend/src/pages/ or frontend/src/components/
- [ ] T025 [US2] Integrate with User Story 1 components while preserving independent testability

**Checkpoint**: User Stories 1 and 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3

- [ ] T026 [P] [US3] Add contract test for the impacted REST endpoint in backend/tests/contract/test_[name].py
- [ ] T027 [P] [US3] Add integration or e2e test for the user journey in backend/tests/integration/test_[name].py or frontend/tests/e2e/[name].spec.ts

### Implementation for User Story 3

- [ ] T028 [P] [US3] Create or update supporting models in backend/src/models/
- [ ] T029 [US3] Implement service logic in backend/src/services/
- [ ] T030 [US3] Implement REST endpoint or handler in backend/src/api/
- [ ] T031 [US3] Implement frontend flow in frontend/src/pages/ or frontend/src/components/

**Checkpoint**: All user stories should now be independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T032 [P] Update README with setup, Railway deployment, live URL, and demo instructions
- [ ] T033 Validate the live Railway deployment against quickstart smoke tests
- [ ] T034 [P] Add or refine cross-cutting security, validation, and regression tests
- [ ] T035 Prepare or update the 2-5 minute demo script or checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - defines the MVP
- **User Story 2 (P2)**: Can start after Foundational - may integrate with US1 but must stay independently testable
- **User Story 3 (P3)**: Can start after Foundational - may integrate with earlier stories but must stay independently testable

### Within Each User Story

- Contract and integration or e2e tests MUST be written and fail before implementation for critical flows
- Models before services
- Services before endpoints
- Backend capability before frontend integration when both are required
- Story complete before moving to the next priority unless parallel staffing is explicit

### Parallel Opportunities

- Setup tasks marked [P] can run in parallel
- Foundational tasks marked [P] can run in parallel after the project skeleton exists
- Once Foundational phase completes, user stories can proceed in parallel if capacity allows
- Tests and model tasks marked [P] can run in parallel when they touch different files

---

## Parallel Example: User Story 1

```text
Task: "Add contract test for the impacted REST endpoint in backend/tests/contract/test_[name].py"
Task: "Add integration or e2e test for the user journey in backend/tests/integration/test_[name].py or frontend/tests/e2e/[name].spec.ts"
Task: "Create or update supporting models in backend/src/models/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently on local and Railway-ready environments
5. Deploy and demo the MVP if ready

### Incremental Delivery

1. Complete Setup and Foundational work
2. Add User Story 1, test independently, deploy, and demo
3. Add User Story 2, test independently, deploy, and demo
4. Add User Story 3, test independently, deploy, and demo
5. Finish with submission artifacts and production smoke validation

### Parallel Team Strategy

1. Team completes Setup and Foundational work together
2. Once Foundational is done:
   Developer A: User Story 1
   Developer B: User Story 2
   Developer C: User Story 3
3. Stories complete and integrate independently before final polish

---

## Notes

- [P] tasks = different files, no blocking dependencies
- [Story] label maps each task to a user story for traceability
- Every critical flow change should leave behind runnable tests and updated docs
- Stop at checkpoints to validate each story independently before expanding scope