import { expect, test } from "@playwright/test";

const actorScreens = {
  Visitor: ["Discover", "Pod preview", "Visitor room", "Public proof", "Application", "Invitation", "Unavailable invite"],
  Participant: ["Today", "My Pods", "Funding", "Waiting room", "Pod room", "Commitment", "Proof type", "Evidence", "Review proof", "Under review", "Approved", "Refund", "Settlement", "Updates", "Members", "Contract"],
  Creator: ["Command center", "Applications", "Funding", "Review queue", "Review proof", "Settlement"],
  Social: ["My profile", "Public profile", "People search", "Messages", "Requests", "Direct message"],
  Operations: ["Transfer queue", "Transfer detail", "Public safety"],
  Onboarding: ["Landing", "Wallet", "Identity", "Avatar", "Privacy", "Template", "Activity", "Community", "NIM commitment", "Publish review"]
} as const;

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
  await expect(page.getByText(/database preview/i)).toBeVisible();

  for (const [actor, screens] of Object.entries(actorScreens)) {
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
    .getByRole("button", { name: "Pod room", exact: true })
    .click();
  await expect(page.locator('[data-preview-label="Pod room"]')).toBeVisible();
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

test("renders the creator review queue in the real mobile companion layout", async ({ page }, testInfo) => {
  test.setTimeout(30_000);
  await page.goto("/design-preview");
  await page.getByRole("button", { name: "Creator", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("navigation", { name: "Creator screens" })
    .getByRole("button", { name: "Review queue", exact: true })
    .click();

  const activeScreen = page.locator('[data-preview-label="Review queue"]');
  await expect(activeScreen).toBeVisible();
  const geometry = await activeScreen.locator("section[class*='mobileScreen']").evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
  await page.screenshot({
    path: testInfo.outputPath("creator-review-queue-mobile.png"),
    fullPage: false
  });
});
