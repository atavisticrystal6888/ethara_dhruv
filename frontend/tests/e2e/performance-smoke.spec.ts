import { expect, test } from "@playwright/test";
import { mockUnauthenticatedApi } from "./support/mockApi";

test("first meaningful UI view stays under the smoke target", async ({ page }) => {
  await mockUnauthenticatedApi(page);
  const started = Date.now();
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading").first().waitFor();
  expect(Date.now() - started).toBeLessThan(2000);
});
