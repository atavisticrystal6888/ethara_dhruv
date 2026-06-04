import { expect, test } from "@playwright/test";
import { mockUnauthenticatedApi, mockWorkspaceApi } from "./support/mockApi";

async function expectNoHorizontalOverflow(page: Parameters<typeof test>[0]["page"]) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
}

test("main viewport avoids horizontal overflow on mobile", async ({ page }) => {
  await mockUnauthenticatedApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await expectNoHorizontalOverflow(page);
});

test("dashboard, your work, and project workspace stay polished on mobile", async ({ page }) => {
  const state = await mockWorkspaceApi(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto("/your-work");
  await expect(page.getByRole("heading", { name: /your work/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto(`/projects/${state.project.id}`);
  await expect(page.getByRole("tab", { name: /board/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("tab", { name: /backlog/i }).click();
  await expect(page.getByRole("heading", { name: /^backlog$/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
