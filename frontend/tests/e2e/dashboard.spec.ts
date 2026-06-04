import { expect, test } from "@playwright/test";
import { mockWorkspaceApi } from "./support/mockApi";

test("dashboard route renders a progress-oriented page", async ({ page }) => {
  const state = await mockWorkspaceApi(page);

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
  await expect(page.getByText(/daily delivery desk/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /your work/i })).not.toBeVisible();

  await page.getByRole("link", { name: /open your work/i }).click();
  await expect(page.getByRole("heading", { name: /your work/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /next up/i })).toBeVisible();

  await page.getByRole("link", { name: /open board/i }).first().click();
  await expect(page).toHaveURL(new RegExp(`/projects/${state.project.id}$`));
  await expect(page.getByRole("tab", { name: /summary/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /board/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /backlog/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /team/i })).toBeVisible();
});
