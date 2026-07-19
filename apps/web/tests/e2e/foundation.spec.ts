import { expect, test } from "@playwright/test";

test("Phase 0 shell fits a narrow mobile viewport", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Momentum starts with a clear commitment." })).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  await page.getByRole("button", { name: /Build/i }).click();
  await expect(
    page.getByRole("region", { name: "Selected evidence contract" })
  ).toContainText("GitHub or live artifact link");
  await expect(page.getByRole("button", { name: /Build/i })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
});

test("reduced motion keeps the selector immediately usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Momentum starts with a clear commitment." })
  ).toBeVisible();
  await page.getByRole("button", { name: /Read/i }).click();
  await expect(
    page.getByRole("region", { name: "Selected evidence contract" })
  ).toContainText("reading artifact");
});
