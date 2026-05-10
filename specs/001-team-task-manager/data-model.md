# Data Model: Team Task Manager

## Entity: User

**Purpose**: Represents a person who can authenticate and participate in projects.

**Fields**:
- `id`: Stable unique identifier.
- `name`: Required display name, 2-80 characters.
- `email`: Required unique email address, normalized to lowercase.
- `passwordHash`: Required secure hash; never returned by APIs.
- `role`: Required global role, `ADMIN` or `MEMBER`.
- `createdAt`: Creation timestamp.
- `updatedAt`: Last update timestamp.

**Relationships**:
- Has many Membership records.
- Has many Tasks as assignee.
- Has many Tasks as creator.

**Validation Rules**:
- Email must be unique and valid.
- Password must be at least 8 characters and include at least one letter and one number.
- First registered user becomes `ADMIN`; later self-registered users become `MEMBER`.
- Password hash and internal auth fields must not appear in API responses.

## Entity: Project

**Purpose**: Workspace for a team and its tasks.

**Fields**:
- `id`: Stable unique identifier.
- `name`: Required project name, 3-120 characters.
- `description`: Optional project description, max 1,000 characters.
- `createdById`: Required User identifier for the Admin who created the project.
- `createdAt`: Creation timestamp.
- `updatedAt`: Last update timestamp.

**Relationships**:
- Has many Membership records.
- Has many Task records.
- Belongs to creator User.

**Validation Rules**:
- Only an authenticated Admin can create, update, or delete projects.
- Project names must be non-empty after trimming.
- Deleting a project must either cascade owned memberships/tasks intentionally or be blocked until child data is handled by a documented rule.

## Entity: Membership

**Purpose**: Connects a User to a Project and controls project visibility.

**Fields**:
- `id`: Stable unique identifier.
- `projectId`: Required Project identifier.
- `userId`: Required User identifier.
- `createdAt`: Creation timestamp.

**Relationships**:
- Belongs to one User.
- Belongs to one Project.

**Validation Rules**:
- `(projectId, userId)` must be unique.
- Only Admin users can add or remove project memberships.
- User and Project must exist before membership is created.
- Removing a member is blocked while the user has To Do or In Progress tasks in the project; an Admin must reassign or complete those tasks first.

## Entity: Task

**Purpose**: Unit of work inside a project.

**Fields**:
- `id`: Stable unique identifier.
- `projectId`: Required Project identifier.
- `title`: Required task title, 3-160 characters.
- `description`: Optional task description, max 2,000 characters.
- `status`: Required TaskStatus value.
- `assigneeId`: Required User identifier for assigned project member.
- `createdById`: Required User identifier for task creator.
- `dueDate`: Required calendar date or timestamp.
- `createdAt`: Creation timestamp.
- `updatedAt`: Last update timestamp.

**Relationships**:
- Belongs to one Project.
- Belongs to one assignee User.
- Belongs to one creator User.

**Validation Rules**:
- Task project must exist.
- Assignee must be a member of the same project.
- Creator must be authenticated and authorized for the project.
- Title must be non-empty after trimming.
- Due date must be a valid date.
- Admins can edit all task fields for projects they administer.
- Members can update status only for tasks assigned to them.

## Entity: TaskStatus

**Purpose**: Lifecycle state for task progress.

**Values**:
- `TODO`: Work has not started.
- `IN_PROGRESS`: Work is active.
- `DONE`: Work is complete.

**State Transitions**:
- `TODO` -> `IN_PROGRESS`
- `TODO` -> `DONE`
- `IN_PROGRESS` -> `DONE`
- `IN_PROGRESS` -> `TODO`
- `DONE` -> `IN_PROGRESS` for corrections by Admin or assigned Member

**Validation Rules**:
- Unsupported status values are rejected.
- A task is overdue when `dueDate` is before the current date and `status` is not `DONE`.
- `DONE` tasks are never counted as overdue.

## Entity: Dashboard Summary

**Purpose**: Read model calculated from projects, memberships, and tasks.

**Fields**:
- `projectCount`: Number of accessible projects.
- `totalTasks`: Number of accessible tasks.
- `assignedTasks`: Number of accessible tasks assigned to the current user.
- `statusTotals`: Counts for `TODO`, `IN_PROGRESS`, and `DONE`.
- `overdueTasks`: Count of overdue accessible tasks.
- `projectSummaries`: Per-project counts and progress percentages.

**Relationships**:
- Derived from User, Membership, Project, and Task records.

**Validation Rules**:
- Admin summaries include Admin-accessible projects.
- Member summaries include only projects where the user has membership.
- Counts must be computed from persisted data, not mocked client state.

## Entity: Submission Artifact

**Purpose**: Tracks externally reviewed delivery outputs.

**Fields**:
- `liveUrl`: Railway production URL.
- `repositoryUrl`: GitHub repository URL.
- `readmePath`: README location.
- `demoVideoUrl`: Demo video URL or placeholder until final submission.
- `smokeTestStatus`: Latest pre-submission smoke-test result.

**Validation Rules**:
- README must include local setup, env vars, database setup, Railway deployment, live URL, and demo link.
- Demo video must be 2-5 minutes and cover auth, RBAC, projects, tasks, dashboard, and deployment proof.
- Live URL must support the evaluator smoke-test flow without local setup.