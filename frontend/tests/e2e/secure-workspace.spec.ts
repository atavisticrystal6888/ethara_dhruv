import { expect, test } from "@playwright/test";
import { mockUnauthenticatedApi } from "./support/mockApi";

test("secure workspace flow exposes login and signup entry points", async ({ page }) => {
  await mockUnauthenticatedApi(page);
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: /sign up/i })).toBeVisible();
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /login/i })).toBeVisible();
});
