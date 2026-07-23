import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  alphaAwarePageSession,
  getMembershipForUser,
  getPublicPodSurface,
  notFound,
  publicPodPageSession
} = vi.hoisted(() => ({
  alphaAwarePageSession: vi.fn(async () => {
    throw new Error("Authenticated browsing must not run for a public Pod read");
  }),
  getMembershipForUser: vi.fn(async () => null),
  getPublicPodSurface: vi.fn(async () => ({
    id: "430296c7-9554-43e6-9b43-bfd063391028",
    creatorUserId: "creator-1",
    templateId: "build",
    stage: "open",
    visitorRoomAvailable: false,
    contractData: {
      templateId: "build",
      activity: {
        name: "Build Pods in Public",
        purpose: "Ship one visible improvement at every occurrence.",
        startDate: "2027-03-01",
        endDate: "2027-03-07"
      },
      commitment: {
        occurrenceCount: 3,
        lunaPerOccurrence: 100_000,
        totalLuna: 300_000
      },
      community: {
        visibility: "public",
        minParticipants: 2,
        maxParticipants: 8
      }
    }
  })),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  publicPodPageSession: vi.fn(async () => null)
}));

vi.mock("next/navigation", () => ({
  notFound
}));

vi.mock("../src/lib/alpha-access-server", () => ({
  alphaAwarePageSession,
  publicPodPageSession
}));

vi.mock("../src/lib/server-db", () => ({
  podsRepository: {
    getMembershipForUser,
    getPublicPodSurface
  }
}));

import PublicPodPage from "../src/app/pods/[podId]/page";

describe("PublicPodPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders an anonymous public Pod without enforcing alpha wallet access", async () => {
    render(
      await PublicPodPage({
        params: Promise.resolve({
          podId: "430296c7-9554-43e6-9b43-bfd063391028"
        })
      })
    );

    expect(
      screen.getByRole("heading", { name: "Build Pods in Public" })
    ).toBeVisible();
    expect(publicPodPageSession).toHaveBeenCalledOnce();
    expect(alphaAwarePageSession).not.toHaveBeenCalled();
    expect(getMembershipForUser).not.toHaveBeenCalled();
  });

  it("rejects a malformed Pod ID before session or database access", async () => {
    await expect(
      PublicPodPage({
        params: Promise.resolve({ podId: "phase-zero-missing" })
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(publicPodPageSession).not.toHaveBeenCalled();
    expect(getPublicPodSurface).not.toHaveBeenCalled();
  });
});
