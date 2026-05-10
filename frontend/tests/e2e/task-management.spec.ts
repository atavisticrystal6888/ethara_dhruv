import { expect, test } from "@playwright/test";

test("task management route is protected for unauthenticated users", async ({ page }) => {
  await page.goto("/projects/demo");
  await expect(page.getByRole("heading", { name: /login/i })).toBeVisible();
});
