import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requireDraftOwner = vi.hoisted(() => vi.fn());

vi.mock("../src/lib/creator-guard", () => ({ requireDraftOwner }));

import ReviewStepPage from "../src/app/pods/create/review/page";

describe("Pod creation review page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("APP_ENV", "alpha");
    vi.stubEnv("NIMIQ_NETWORK", "testnet");
    vi.stubEnv("PODS_DEPOSIT_MODE", "public");
    vi.stubEnv("PODS_SETTLEMENT_ENABLED", "true");
    vi.stubEnv("PODS_PROPORTIONAL_PUBLISHING_ENABLED", "false");
    vi.stubEnv("PODS_FINANCIAL_INCIDENT_PAUSED", "false");
    requireDraftOwner.mockResolvedValue({
      pod: {
        id: "pod-1",
        templateId: "build",
        draftData: {
          activity: {},
          community: {},
          commitment: {}
        }
      }
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps the saved draft non-mutating when publication is paused", async () => {
    render(
      await ReviewStepPage({
        searchParams: Promise.resolve({ draft: "pod-1" })
      })
    );

    expect(
      screen.getByRole("heading", { name: "Publishing is paused." })
    ).toBeVisible();
    expect(
      screen.getByText("Your draft is saved. No contract has been published or changed.")
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Return to My Pods" })
    ).toHaveAttribute("href", "/my-pods");
    expect(
      screen.queryByRole("button", { name: "Publish Pod" })
    ).not.toBeInTheDocument();
  });
});
