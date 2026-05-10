import { expect, test } from "@playwright/test";

test("live submission URL loads the app shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toContainText(/team task manager|dashboard|login/i);
});
