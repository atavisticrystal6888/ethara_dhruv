# Railway Smoke Test

Record the deployed backend URL, frontend URL, and test date before running this checklist.

```text
Backend URL:
Frontend URL:
Smoke test date:
Tester:
Result:
```

## Checks

- Open the frontend URL and confirm the page loads without local setup.
- Sign up as the first user and confirm the account is `ADMIN`.
- Sign up as a second user and confirm the account is `MEMBER`.
- Log in as Admin and create a project.
- Search for the Member by name or email and add the Member to the project.
- Create three tasks: one `TODO`, one `IN_PROGRESS`, and one `DONE`.
- Set one non-Done task due before today.
- Log in as Member and confirm the project and assigned task are visible.
- Update the assigned task status as Member.
- Attempt membership management as Member and confirm the action is denied.
- Open the dashboard as both users and confirm task totals, status totals, assigned work, and overdue counts match saved data.
- Check a desktop and mobile viewport for readable layout, no horizontal scrolling, and visible primary actions.
- Open `/api/health` on the backend URL and confirm `status` and `database` return `ok`.

## Evidence

Attach screenshots or a short note for failed checks before resubmitting.
