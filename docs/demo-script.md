# Demo Script

Target length: 2 to 5 minutes.

## Opening

- Show the live Railway frontend URL.
- State that the app is backed by an Express REST API, direct PostgreSQL access via `pg`, and Railway PostgreSQL.

## Authentication And Roles

- Sign up as the first user and show the Admin role.
- Sign up or log in as a Member account.
- Show that protected pages require authentication.

## Project And Membership Flow

- As Admin, create a project.
- Search for the Member by name or email.
- Add the Member to the project.
- Switch to Member and show that Admin-only membership controls are unavailable or denied.

## Task Flow

- As Admin, create issues with different types, priorities, and due dates.
- Assign at least one task to the Member.
- Show validation behavior for a missing or invalid required task field.
- As Member, update the assigned task status.

## Workspace And Planning Flow

- Open a project and show the Summary, Board, Backlog, and Team tabs.
- Use the board toolbar to filter by status, issue type, priority, sprint, and assignee.
- In Backlog, create a sprint, move work into it, and reorder backlog items.

## Collaboration Flow

- Open an issue detail panel from the board or backlog.
- Add a comment and show the activity history updating after a status change or planning action.

## Personal Work Surface

- Open `Your Work` and show the current user's queue, role-delegated work, and any active timers.

## Dashboard And Submission Proof

- Show dashboard totals, status breakdowns, assigned work, overdue count, and the new work-first CTA into `Your Work`.
- Open the README and point to local setup, environment variables, Railway deployment steps, live URL, and demo video link.
- Show `/api/health` on the deployed backend.
