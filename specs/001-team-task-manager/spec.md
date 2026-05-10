# Feature Specification: Team Task Manager

**Feature Branch**: `001-team-task-manager`
**Created**: 2026-05-10
**Status**: Draft
**Input**: User description: "Build a full-stack Team Task Manager web app where users can create projects, assign tasks, track progress, enforce Admin/Member role-based access, expose REST APIs with a persistent database, deploy live on Railway, and submit a live URL, GitHub repository, README, and 2-5 minute demo video. Evaluation covers frontend flow, backend API/security/data quality, visual polish, responsiveness, validations, and loading/error states."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Establish Secure Team Workspace (Priority: P1)

An unauthenticated visitor can sign up or log in, and an Admin can create the first usable project workspace with at least one Member assigned to it. Authenticated users only see project data they are permitted to access, and role-restricted actions are blocked for Members.

**Why this priority**: Authentication, role separation, project ownership, and team membership are the foundation for every other feature and for the backend security evaluation.

**Independent Test**: Create the first Admin account, create a second Member account, log in as both users, create a project as Admin, assign the Member to the project, and verify the Member cannot access Admin-only team management actions.

**Acceptance Scenarios**:

1. **Given** a new deployment with no users, **When** the first visitor signs up with valid details, **Then** the system creates an Admin account and opens an authenticated workspace.
2. **Given** an authenticated Admin, **When** the Admin creates a project with a valid name and description, **Then** the project is saved and visible in the Admin's project list.
3. **Given** an authenticated Admin and an existing Member account, **When** the Admin adds the Member to a project, **Then** the Member can view that project after logging in.
4. **Given** an authenticated Member assigned to a project, **When** the Member attempts to manage project membership, **Then** the system denies the action and explains that Admin access is required.
5. **Given** an unauthenticated visitor, **When** the visitor requests any project, task, or dashboard view, **Then** the system requires login before showing protected data.

---

### User Story 2 - Manage Tasks and Assignments (Priority: P2)

Admins can create tasks inside projects, assign them to project Members, set due dates and statuses, and Members can update allowed task progress for tasks assigned to them.

**Why this priority**: Task creation, assignment, status tracking, validation, and business rules are the core product behavior and map directly to frontend, backend, and database evaluation criteria.

**Independent Test**: With one Admin, one Member, and one project from User Story 1, create tasks with valid and invalid inputs, assign a task to the Member, update the task status as the Member, and verify invalid cross-project assignment is rejected.

**Acceptance Scenarios**:

1. **Given** an Admin viewing a project, **When** the Admin creates a task with title, description, due date, status, and assigned Member, **Then** the task appears in the project task list with the saved details.
2. **Given** an Admin creating a task, **When** required fields are missing or the assigned user is not a project Member, **Then** the system rejects the task and shows field-specific validation feedback.
3. **Given** a Member assigned to a task, **When** the Member changes the task status from To Do to In Progress or Done, **Then** the task status is updated and visible to other project members.
4. **Given** a Member not assigned to a task, **When** the Member attempts to modify that task, **Then** the system denies the change unless the Member has Admin permissions for the project.

---

### User Story 3 - Track Progress on Dashboard (Priority: P3)

Authenticated users can view a dashboard that summarizes their accessible projects and tasks, including total tasks, status breakdowns, assigned work, and overdue tasks.

**Why this priority**: The dashboard demonstrates progress tracking, persisted data correctness, status indicators, and visual data presentation required by the evaluation rubric.

**Independent Test**: Create a project with tasks across multiple statuses and due dates, log in as Admin and Member, and verify each dashboard shows counts and overdue visibility that match the user's permitted data.

**Acceptance Scenarios**:

1. **Given** an Admin with projects and tasks, **When** the Admin opens the dashboard, **Then** the dashboard shows project count, task count, status totals, assigned work, and overdue totals across Admin-accessible projects.
2. **Given** a Member assigned to tasks in one or more projects, **When** the Member opens the dashboard, **Then** the dashboard shows only the projects and tasks the Member is allowed to access.
3. **Given** a task with a due date before the current date and a status other than Done, **When** dashboard totals are calculated, **Then** the task is counted as overdue.
4. **Given** all tasks in a project are marked Done, **When** the dashboard displays progress, **Then** the project is shown as complete or fully progressed without any overdue count.

---

### User Story 4 - Use a Polished Responsive Interface (Priority: P4)

Users can complete the main flows on desktop and mobile-sized screens through a clean, professional interface with readable typography, consistent status indicators, clear validation messages, and understandable loading and empty states.

**Why this priority**: Visual quality, responsiveness, error states, loading states, and polish account for a significant portion of the frontend and visual evaluation.

**Independent Test**: Complete signup, login, project creation, task assignment, status update, and dashboard review on desktop and mobile widths while verifying that forms, navigation, status indicators, loading states, and empty states remain clear and usable.

**Acceptance Scenarios**:

1. **Given** a user on a mobile-sized screen, **When** the user navigates between dashboard, projects, and task flows, **Then** primary actions remain visible and content does not require horizontal scrolling.
2. **Given** a form submission with invalid data, **When** the user submits the form, **Then** the relevant fields show concise validation messages without losing the user's valid entries.
3. **Given** a dashboard, project list, or task list with no data, **When** the user opens the view, **Then** the empty state explains what is missing and provides the next appropriate action for that role.
4. **Given** a request is in progress, **When** the user waits for the result, **Then** the interface shows a loading state and prevents duplicate destructive or state-changing submissions.

---

### User Story 5 - Submit a Complete Live Assignment (Priority: P5)

An evaluator can open the submitted live Railway URL, review the GitHub repository and README, and watch a 2-5 minute demo video that demonstrates the required full-stack behavior.

**Why this priority**: The assignment explicitly requires a live and fully functional Railway deployment plus submission artifacts; incomplete submission materials disqualify otherwise working code.

**Independent Test**: Use only the submitted README, live URL, repository, and demo video to verify the app can be accessed, authenticated, exercised, and understood without private instructions.

**Acceptance Scenarios**:

1. **Given** the submitted live URL, **When** an evaluator opens it, **Then** the application loads and supports signup, login, project creation, task assignment, status updates, and dashboard review.
2. **Given** the submitted repository, **When** an evaluator reads the README, **Then** the README includes project overview, local setup, environment variables, database setup, Railway deployment notes, live URL, and demo video link.
3. **Given** the demo video, **When** an evaluator watches it, **Then** the video is between 2 and 5 minutes and covers authentication, Admin/Member access, project and task management, dashboard progress, and deployment status.

### Edge Cases

- Duplicate signup attempts with an existing email must be rejected with a clear message.
- Invalid login credentials must not reveal whether an email is registered.
- Unauthenticated users must not access project, task, team, or dashboard data.
- Members must not manage team membership, assign tasks to users outside a project, or access projects where they are not members.
- Admins must not assign tasks to users who are not project Members.
- Tasks with missing title, invalid due date, missing assignee, or unsupported status must be rejected before persistence.
- A task due before the current date and not Done must be treated as overdue; a Done task must not be counted as overdue.
- Empty project lists, empty task lists, and empty dashboards must provide role-appropriate next steps.
- Slow or failed network requests must show user-friendly loading and error states without corrupting saved data.
- Railway or database configuration problems must produce an operational error state rather than exposing secrets or internal details.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow visitors to sign up with validated account details and log in with registered credentials.
- **FR-002**: System MUST create the first registered user as an Admin when no users exist.
- **FR-003**: System MUST assign subsequent self-registered users the Member role.
- **FR-004**: System MUST allow authenticated users to log out and prevent further protected access until they log in again.
- **FR-005**: System MUST enforce Admin and Member permissions on the server for every project, membership, task, and dashboard action.
- **FR-006**: System MUST expose documented REST operations for authentication, projects, memberships, tasks, dashboard summaries, and submission health checks.
- **FR-007**: System MUST persist users, projects, memberships, tasks, roles, task statuses, and due dates in a database.
- **FR-008**: System MUST maintain relationships between projects, project members, tasks, task assignees, and task creators.
- **FR-009**: Admins MUST be able to create, view, update, and delete projects they own or administer.
- **FR-010**: Admins MUST be able to search existing users by name or email, add them to projects as Members, and remove Members from projects when no required assignment rule is violated.
- **FR-011**: Members MUST be able to view only projects where they have membership.
- **FR-012**: Members MUST be denied project membership management and role management actions.
- **FR-013**: Admins MUST be able to create tasks inside projects with title, optional description, status, assignee, and due date.
- **FR-014**: System MUST validate that a task assignee belongs to the same project as the task.
- **FR-015**: System MUST support task statuses To Do, In Progress, and Done.
- **FR-016**: Admins MUST be able to update task details, assignment, due date, and status within projects they administer.
- **FR-017**: Members MUST be able to update status for tasks assigned to them.
- **FR-018**: Members MUST be denied updates to tasks outside their assignments unless they have Admin permissions for that project.
- **FR-019**: System MUST calculate overdue tasks as tasks whose due date is before the current date and whose status is not Done.
- **FR-020**: System MUST provide dashboard summaries for accessible projects, total tasks, assigned tasks, status breakdowns, and overdue tasks.
- **FR-021**: Dashboard data MUST be derived from persisted project, membership, and task data.
- **FR-022**: System MUST show validation feedback for required fields, invalid relationships, invalid dates, duplicate account details, and unauthorized actions.
- **FR-023**: System MUST provide loading, empty, success, and error states for authentication, project, task, team, and dashboard flows.
- **FR-024**: System MUST provide a responsive interface usable on desktop and mobile-sized screens.
- **FR-025**: System MUST use consistent visual status indicators for To Do, In Progress, Done, and Overdue states.
- **FR-026**: System MUST avoid exposing secrets, database details, or internal error traces to end users.
- **FR-027**: System MUST be deployable to Railway as a live, fully functional application backed by the selected database.
- **FR-028**: System MUST provide a live URL that supports the full evaluator smoke test without local setup.
- **FR-029**: Repository documentation MUST include overview, local setup, environment variables, database setup, Railway deployment steps, live URL, and demo video link.
- **FR-030**: Demo materials MUST show signup or login, Admin and Member role behavior, project management, task assignment, status tracking, dashboard progress, and the live deployment.

### Key Entities *(include if feature involves data)*

- **User**: A registered person who can authenticate, hold a global role, and participate in projects through memberships.
- **Role**: The permission level assigned to a user, initially Admin for the first user and Member for later self-registered users.
- **Project**: A workspace for a team, containing descriptive project details, project membership, and tasks.
- **Membership**: The relationship between a User and a Project, used to determine project visibility and Member participation.
- **Task**: A unit of work inside one Project, with title, optional description, status, assignee, creator, due date, and overdue state derived from status and date.
- **Task Status**: The lifecycle value for a task: To Do, In Progress, or Done.
- **Dashboard Summary**: A read model or calculated view of accessible projects, task counts, status totals, assigned work, and overdue work.
- **Submission Artifact**: The externally reviewed deliverables: live URL, GitHub repository, README, and 2-5 minute demo video.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can complete signup, login, and logout in under 2 minutes using valid information.
- **SC-002**: An Admin can create a project, add a Member, create a task, assign it, and view it in the project list in under 4 minutes.
- **SC-003**: A Member can find assigned tasks and update an allowed task status in under 2 minutes.
- **SC-004**: 100% of role-restricted scenario tests deny unauthorized Admin-only actions for Members and unauthenticated users.
- **SC-005**: Dashboard totals match persisted task data for a test set of at least 20 tasks across all statuses, including overdue and completed tasks.
- **SC-006**: Users receive clear validation feedback for every required signup, login, project, membership, and task form field in the evaluator scenario set.
- **SC-007**: The primary flows are usable at desktop width and mobile width without horizontal scrolling or overlapping text.
- **SC-008**: The live Railway URL supports signup, login, project creation, member assignment, task assignment, status update, and dashboard review without local setup.
- **SC-009**: The README enables a new developer to run the project locally and understand Railway deployment steps in under 15 minutes.
- **SC-010**: The demo video is 2-5 minutes long and covers all required feature areas and submission proof points.
- **SC-011**: Evaluators can map the delivered app to all frontend, backend, and visual rubric categories without relying on undocumented behavior.

## Assumptions

- The first successfully registered user becomes the initial Admin; later self-registered users become Members by default.
- Email and password authentication is sufficient for the assignment; password reset, MFA, and third-party sign-in are out of scope for the first submission unless added later.
- Admin users can manage projects, project membership, and all tasks in projects they administer.
- Member users can view projects where they are members and update status only for tasks assigned to them.
- Adding users to projects can use existing registered user accounts; email invitation delivery is out of scope for the first submission.
- SQL or NoSQL storage may be selected during planning, but the chosen database must enforce or reliably preserve the required relationships and validations.
- Native mobile apps are out of scope; the required mobile experience is responsive web behavior.
- Railway is the mandatory deployment target for selection, and the live deployment must use environment-managed secrets.
- The README and demo video are part of the acceptance scope, not optional post-development polish.