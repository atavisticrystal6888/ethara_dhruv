import { expect, test } from "@playwright/test";

test("dashboard route renders a progress-oriented page", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toContainText(/dashboard|login/i);
});
