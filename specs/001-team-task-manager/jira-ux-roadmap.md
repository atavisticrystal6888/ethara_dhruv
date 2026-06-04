# Jira-Inspired Upgrade Plan

This roadmap extends the current Team Task Manager into a denser, more work-oriented team delivery product. The goal is not to clone Jira feature-for-feature. The goal is to borrow the interaction patterns that make Jira effective for teams: issue-first workflows, strong project navigation, fast triage, backlog planning, and visible collaboration history.

## Current Product Assessment

The current app already covers the original assignment well:

- Secure signup, login, logout, and first-user Admin bootstrap.
- Project membership with role-aware access.
- Task list, board, timeline, and calendar views.
- Recurring tasks, time tracking, and dashboard summaries.

The main gap is not feature quantity. The gap is product shape.

- The navigation is still light and brand-heavy instead of work-heavy.
- The task model is still too shallow for team triage and prioritization.
- The project workspace centers a long create form instead of an issue workflow.
- The board is visual but static. It lacks drag-and-drop, filtering, and issue detail context.
- The dashboard emphasizes summary metrics more than "my work", "at risk", and recent team activity.

## Jira Patterns Worth Borrowing

- Dense left navigation with fast access to dashboard, projects, and personal work.
- Project-local tabs such as Summary, Board, Backlog, Timeline, Team, and Settings.
- Issue keys, issue types, priority levels, labels, assignee avatars, and reporter context.
- Search and filter bars that stay visible while scanning work.
- Drag-and-drop board interactions with persistent ordering.
- Backlog and sprint planning separate from the active board.
- Issue detail drawers or modals with comments and activity history.
- Dashboard modules focused on due-soon, overdue, assigned-to-me, active sprint, and recent changes.

## Scope Boundary

This upgrade should stay focused on high-value team-task-manager behavior.

- Keep the current RBAC and project membership foundation.
- Keep recurring tasks and timers, but move them out of the primary hero experience.
- Do not attempt custom workflow builders, automation rules, notifications, or full Jira admin configuration in the first uplift.
- Prefer one strong project workspace over many shallow secondary features.

## Product Direction

The north-star experience should feel like a delivery cockpit for a small team:

- Global app shell: compact left rail with Dashboard, Your Work, Projects, and quick-create.
- Project workspace: tabs for Summary, Board, Backlog, Timeline, Team.
- Board: active sprint or active work only, dense cards, filter bar, drag-and-drop lanes.
- Backlog: prioritized unscheduled work plus sprint buckets.
- Issue detail: drawer or modal with editable fields, comments, and activity.
- Dashboard: action-oriented modules instead of oversized hero sections.

## Changes Needed

## 1. Domain Model And Database

The current task model only covers title, description, status, assignment, due date, recurrence, and time tracking. To behave more like a team task manager, it needs richer delivery metadata.

Add to Task:

- issueKey
- issueType: EPIC, STORY, TASK, BUG
- priority: LOW, MEDIUM, HIGH, CRITICAL
- reporterId
- storyPoints
- sprintId nullable
- sortOrder
- parentTaskId nullable

Add new tables:

- Sprint
- Label
- TaskLabel
- TaskComment
- TaskActivity

Recommended modeling choices:

- Model epics as issues with issueType = EPIC and use parentTaskId for child issues.
- Use sortOrder for board and backlog drag-and-drop persistence.
- Store comments and activity separately so issue detail remains extensible.

## 2. Backend API

The API needs to support issue triage, planning, and collaboration instead of only CRUD.

Expand task endpoints to support:

- create and update with issueType, priority, labels, storyPoints, reporterId, sprintId, parentTaskId
- list filters for status, assigneeId, priority, issueType, sprintId, label, overdue, and text search
- sorting by priority, due date, createdAt, updatedAt, and manual sortOrder
- reorder endpoint for drag-and-drop moves across columns and backlog sections

Add new endpoints for:

- sprint create, list, update, start, complete
- task comments create, list, delete
- task activity list

Optional phase-two endpoints:

- bulk issue update
- saved filters

## 3. Frontend Information Architecture

The UI currently looks more like a polished assignment app than an operational team workspace. The structure should shift from large hero sections to faster scanning and action density.

Global shell changes:

- Replace the brand-heavy sidebar with a denser product nav.
- Add a quick-create button.
- Add a "Your Work" entry between Dashboard and Projects.
- Add recent projects or a lightweight project switcher.

Project workspace changes:

- Replace the single mixed page with tabs for Summary, Board, Backlog, Timeline, and Team.
- Move task creation from the always-open inline form into a modal or issue drawer.
- Add a sticky toolbar with search, assignee filter, status filter, priority filter, and sprint selector.

Dashboard changes:

- Replace oversized summary-first layout with modules for Assigned to Me, Due Soon, Overdue, Active Sprint, and Recent Activity.
- Demote recurring-task and timer metrics to secondary widgets.

## 4. Core Interaction Changes

These changes matter more than visual polish alone.

Board:

- Make cards draggable between columns.
- Persist lane and position changes.
- Show issue key, type icon, priority, assignee, due date, and labels on each card.

Backlog:

- Add unscheduled backlog ordering.
- Add sprint buckets.
- Allow moving issues between backlog and sprint.

Issue detail:

- Add a detail drawer or modal that opens from board, backlog, and list rows.
- Allow inline editing of title, description, status, assignee, priority, issue type, due date, and story points.
- Show comments and activity history in the same context.

List view:

- Convert the current card list into a denser table-like list for triage.
- Support quick filters and sort controls.

## 5. Visual Design Direction

The current UI has strong polish, but it leans toward showcase styling. A Jira-inspired upgrade should look more operational.

- Reduce oversized hero sections and presentation copy.
- Tighten spacing and increase information density.
- Use clear issue icons, priority tokens, labels, avatar chips, and status colors.
- Keep readable type and strong contrast, but reduce decorative glassmorphism in primary work surfaces.
- Prefer stable layouts, sticky toolbars, and predictable placement of primary actions.
- Keep mobile support through drawers and collapsible filters instead of shrinking dense desktop controls.

## 6. Testing And Delivery

The uplift affects both behavior and IA, so it needs more than visual validation.

Backend tests needed:

- contract coverage for sprint, comment, and activity endpoints
- integration coverage for reorder, filtering, sprint membership, and activity logging

Frontend tests needed:

- e2e coverage for board drag-and-drop, backlog planning, and issue comments
- unit coverage for filter state, issue drawer behavior, and optimistic updates
- responsive checks for dense desktop views and drawer-based mobile flows

## Concrete File Changes In This Repo

Existing frontend files that should change:

- frontend/src/components/layout/AppShell.tsx
- frontend/src/pages/DashboardPage.tsx
- frontend/src/pages/ProjectsPage.tsx
- frontend/src/pages/ProjectDetailPage.tsx
- frontend/src/components/tasks/TaskForm.tsx
- frontend/src/components/tasks/TaskList.tsx
- frontend/src/components/tasks/TaskViews.tsx
- frontend/src/components/dashboard/SummaryCards.tsx
- frontend/src/components/dashboard/StatusBreakdown.tsx
- frontend/src/components/dashboard/ProjectProgressList.tsx
- frontend/src/api/client.ts
- frontend/src/styles/theme.css

New frontend files likely needed:

- frontend/src/components/layout/ProjectTabs.tsx
- frontend/src/components/tasks/IssueDrawer.tsx
- frontend/src/components/tasks/BoardToolbar.tsx
- frontend/src/components/tasks/BacklogView.tsx
- frontend/src/components/tasks/CommentThread.tsx
- frontend/src/components/tasks/ActivityFeed.tsx
- frontend/src/pages/YourWorkPage.tsx

Existing backend files that should change:

- backend/src/types/domain.ts
- backend/src/validations/task.schemas.ts
- backend/src/api/task.routes.ts
- backend/src/services/task.service.ts
- backend/src/services/serializers.ts
- backend/src/services/dashboard.service.ts
- backend/src/models/postgresDatabase.ts

New backend files likely needed:

- backend/src/api/sprint.routes.ts
- backend/src/services/sprint.service.ts
- backend/src/services/comment.service.ts
- backend/db/migrations/00x_jira_upgrade.sql

## Phased Plan

## Phase 1: Workspace Restructure

Goal: make the product feel like a team workspace before adding deeper planning entities.

- Redesign AppShell into a denser product nav.
- Add Project tabs and a Your Work page.
- Replace the always-open task form with quick-create and issue-detail entry points.
- Reshape the dashboard around action-oriented work modules.

## Phase 2: Issue Model Uplift

Goal: add the metadata required for real triage.

- Add issueType, priority, reporter, storyPoints, labels, and sortOrder.
- Update database migrations, serializers, validation, and API client types.
- Update forms and task surfaces to display and edit the new metadata.

## Phase 3: Board And Backlog Planning

Goal: make project delivery planning interactive.

- Implement drag-and-drop board moves with persistent ordering.
- Build a backlog view for unscheduled work.
- Add sprint entities and current-sprint selection.
- Add filters and search that work across board and backlog.

## Phase 4: Collaboration Layer

Goal: make each issue a real collaboration object.

- Add issue comments.
- Add activity tracking for status, assignee, priority, sprint, and description changes.
- Surface recent activity in the dashboard and issue detail.

## Phase 5: Hardening And Polish

Goal: stabilize the upgraded product for demo and deployment.

- Expand contract, integration, unit, and e2e test coverage.
- Tune responsive behavior for dense workspace screens.
- Review performance of filtered project and dashboard queries.
- Update README and demo script once the new IA is stable.

## Recommended MVP Cut

If the uplift needs to stay lean, this is the best first slice:

1. Denser app shell and project tabs.
2. Issue type, priority, labels, and reporter.
3. Sticky search and filter bar.
4. Drag-and-drop board with persistent ordering.
5. Issue detail drawer.
6. Comments and activity feed.
7. Backlog plus one active sprint view.

This slice will make the app feel substantially closer to a real team task manager without trying to build all of Jira.

## Suggested Execution Order

1. Update the backend task model and database migration first.
2. Expand REST contracts and frontend API types next.
3. Restructure the project workspace IA before doing deep visual polish.
4. Add drag-and-drop only after reorder and sortOrder support exists.
5. Add comments and activity after the issue drawer exists.

## Success Criteria For The Uplift

- A team member can find assigned work in under 30 seconds from the dashboard or project workspace.
- A manager can create, prioritize, schedule, and move work without leaving the project workspace.
- Board and backlog changes remain correct after refresh.
- Comments and activity make issue history understandable without external notes.
- The product reads as a delivery workspace instead of an assignment showcase.