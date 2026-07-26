import { expect, test } from "@playwright/test";

import {
  ACTOR_DEFINITIONS,
  SCREEN_REGISTRY
} from "../../src/components/design-preview/registry";

const actorJourneys = Object.values(ACTOR_DEFINITIONS).map((actor) => ({
  actor: actor.label,
  screens: actor.screens.map((screen) => SCREEN_REGISTRY[screen].label)
}));

test.use({
  viewport: { width: 1440, height: 1000 }
});

test("renders every independent role flow without mobile-frame overflow", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const browserIssues: string[] = [];

  page.on("pageerror", (error) => {
    browserIssues.push(`pageerror: ${error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      browserIssues.push(`console: ${message.text()}`);
    }
  });

  await page.goto("/design-preview");
  await expect(
    page.getByText(
      "Live public data is kept separate from simulated journey fixtures."
    )
  ).toBeVisible();

  for (const { actor, screens } of actorJourneys) {
    await page.getByRole("button", { name: actor, exact: true }).click();
    for (const screen of screens) {
      await page
        .getByRole("navigation", { name: `${actor} screens` })
        .getByRole("button", { name: screen, exact: true })
        .click();
      const activeScreen = page.locator(`[data-preview-label="${screen}"]`);
      await expect(activeScreen).toBeVisible();
      const geometry = await activeScreen.locator("section[class*='mobileScreen']").evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        offenders: [...element.querySelectorAll<HTMLElement>("*")]
          .map((candidate) => {
            const box = candidate.getBoundingClientRect();
            const parent = element.getBoundingClientRect();
            return {
              className: candidate.className,
              tag: candidate.tagName,
              left: Math.round(box.left - parent.left),
              right: Math.round(box.right - parent.left),
              width: Math.round(box.width)
            };
          })
          .filter((candidate) => candidate.left < -1 || candidate.right > element.clientWidth + 1)
          .slice(0, 8)
      }));
      expect(
        geometry.scrollWidth,
        `${actor} / ${screen}: ${JSON.stringify(geometry.offenders)}`
      ).toBeLessThanOrEqual(geometry.clientWidth);
    }
  }

  await page.getByRole("button", { name: "Participant", exact: true }).click();
  await page.getByRole("navigation", { name: "Participant screens" })
    .getByRole("button", { name: "Pod Room", exact: true })
    .click();
  await expect(page.locator('[data-preview-label="Pod Room"]')).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("participant-room.png"),
    fullPage: false
  });

  await page.getByRole("button", { name: "Creator", exact: true }).click();
  await page.getByRole("navigation", { name: "Creator screens" })
    .getByRole("button", { name: "Review queue", exact: true })
    .click();
  await expect(page.locator('[data-preview-label="Review queue"]')).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("creator-review-queue.png"),
    fullPage: false
  });

  await page.getByRole("navigation", { name: "Creator screens" })
    .getByRole("button", { name: "Review proof", exact: true })
    .click();
  await expect(page.locator('[data-preview-label="Review proof"]')).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("creator-review.png"),
    fullPage: false
  });

  await page.getByRole("button", { name: "Social", exact: true }).click();
  await page.getByRole("navigation", { name: "Social screens" })
    .getByRole("button", { name: "Public profile", exact: true })
    .click();
  await expect(page.locator('[data-preview-label="Public profile"]')).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("public-profile.png"),
    fullPage: false
  });

  expect(browserIssues, browserIssues.join("\n")).toEqual([]);
});

for (const viewport of [
  { width: 320, height: 700 },
  { width: 390, height: 844 }
]) {
  test(`operates the mobile companion at ${viewport.width}px`, async ({ page }) => {
    test.setTimeout(30_000);
    await page.setViewportSize(viewport);
    await page.goto("/design-preview");

    const trigger = page.getByRole("button", {
      name: "Open preview controls"
    });
    await trigger.click();
    const companion = page.getByRole("dialog", { name: "Preview controls" });
    await expect(companion).toBeVisible();
    await expect(
      companion.getByRole("button", { name: "Close preview controls" })
    ).toBeFocused();

    const creator = companion.getByRole("button", {
      name: "Creator",
      exact: true
    });
    await creator.click();
    await expect(creator).toHaveAttribute("aria-pressed", "true");

    const scenario = companion.getByRole("combobox", {
      name: "Mobile visual state"
    });
    await scenario.selectOption("loading");
    await expect(scenario).toHaveValue("loading");

    await companion
      .getByRole("button", { name: "Close preview controls" })
      .focus();
    await page.keyboard.press("Escape");
    await expect(companion).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}
