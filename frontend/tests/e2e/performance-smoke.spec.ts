import { expect, test } from "@playwright/test";

test("first meaningful UI view stays under the smoke target", async ({ page }) => {
  const started = Date.now();
  await page.goto("/login");
  await page.getByRole("heading").first().waitFor();
  expect(Date.now() - started).toBeLessThan(2000);
});
