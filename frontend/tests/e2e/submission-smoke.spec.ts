import { expect, test } from "@playwright/test";
import { mockWorkspaceApi } from "./support/mockApi";

test("live submission URL loads the app shell", async ({ page }) => {
  await mockWorkspaceApi(page);

  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("navigation", { name: /primary/i })).toContainText(/dashboard/i);
  await expect(page.getByRole("navigation", { name: /primary/i })).toContainText(/your work/i);
  await expect(page.getByRole("navigation", { name: /primary/i })).toContainText(/projects/i);
  await expect(page.getByText(/daily delivery desk/i)).toBeVisible();
});
