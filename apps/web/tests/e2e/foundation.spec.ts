import { expect, test } from "@playwright/test";

test("the public landing fits a narrow mobile viewport", async ({ page }) => {
  const imageWarnings: string[] = [];
  page.on("console", (message) => {
    if (
      message.text().includes("Largest Contentful Paint")
    ) {
      imageWarnings.push(message.text());
    }
  });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Make showing up feel real." })).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(page.getByRole("region", { name: "The accountability loop." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "One engine. Five rituals." })).toBeVisible();
  await page.waitForTimeout(250);
  expect(imageWarnings).toEqual([]);
});

test("reduced motion keeps the landing actions immediately usable", async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes("hydrated")) {
      hydrationErrors.push(message.text());
    }
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Make showing up feel real." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Wallet" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Wallet" })).toBeEnabled();
  expect(hydrationErrors).toEqual([]);
});
