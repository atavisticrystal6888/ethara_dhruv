import { expect, test } from "@playwright/test";
import { mockUnauthenticatedApi, mockWorkspaceApi } from "./support/mockApi";

test("task management route is protected for unauthenticated users", async ({ page }) => {
  await mockUnauthenticatedApi(page);
  await page.goto("/projects/demo");
  await expect(page.getByRole("heading", { name: /login/i })).toBeVisible();
});

test("board, backlog planning, and issue comments stay interactive in the upgraded workspace", async ({ page }) => {
  const state = await mockWorkspaceApi(page);

  await page.goto(`/projects/${state.project.id}`);
  await expect(page.getByText(state.project.name)).toBeVisible();

  const todoColumn = page.locator("section", { has: page.getByRole("heading", { name: /to do/i }) });
  const inProgressColumn = page.locator("section", { has: page.getByRole("heading", { name: /in progress/i }) });
  const moveRightButton = todoColumn
    .locator("article", { hasText: /polish backlog handoff/i })
    .locator(".board-card-actions")
    .getByRole("button", { name: /move right/i });

  await moveRightButton.focus();
  await moveRightButton.press("Enter");
  await expect(inProgressColumn.getByText(/polish backlog handoff/i)).toBeVisible();

  await page.getByRole("tab", { name: /backlog/i }).click();
  await expect(page.getByRole("heading", { name: /^backlog$/i })).toBeVisible();

  const backlogSection = page.locator("section", { has: page.getByRole("heading", { name: /^backlog$/i }) });
  await backlogSection.locator("article", { hasText: /refine board ordering/i }).getByRole("button", { name: /move down/i }).click();
  await expect(backlogSection.locator(".planning-task").first()).toContainText(/polish backlog handoff/i);

  await page.getByLabel(/sprint name/i).fill("Sprint 13");
  await page.getByLabel(/goal/i).fill("Lock the upgraded workspace demo flows");
  await page.getByRole("button", { name: /create sprint/i }).click();
  await expect(page.getByRole("heading", { name: /sprint 13/i })).toBeVisible();

  const backlogTask = backlogSection.locator("article", { hasText: /refine board ordering/i });
  await backlogTask.locator("select").selectOption({ label: "Sprint 13" });

  const sprintSection = page.locator("section", { has: page.getByRole("heading", { name: /sprint 13/i }) });
  await expect(sprintSection.getByText(/refine board ordering/i)).toBeVisible();

  await sprintSection.locator("article", { hasText: /refine board ordering/i }).getByRole("button", { name: /open issue/i }).click();
  await expect(page.getByRole("heading", { name: /issue detail/i })).toBeVisible();
  await page.getByLabel(/add comment/i).fill("Backlog planning is now covered in Playwright.");
  const postCommentButton = page.getByRole("button", { name: /post comment/i });
  await postCommentButton.focus();
  await postCommentButton.press("Enter");
  await expect(page.getByText(/backlog planning is now covered in playwright\./i)).toBeVisible();
});
