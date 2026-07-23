import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getPublicPodContributor = vi.hoisted(() => vi.fn());
const notFound = vi.hoisted(() => vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
}));

vi.mock("next/navigation", () => ({ notFound }));
vi.mock("../src/lib/server-db", () => ({
  podsRepository: { getPublicPodContributor }
}));

import PublicPodContributorPage from "../src/app/pods/[podId]/contributors/[handle]/page";

describe("public Pod contributor page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("PODS_PUBLIC_VISITOR_ROOMS_ENABLED", "true");
    getPublicPodContributor.mockResolvedValue({
      handle: "private_builder",
      displayName: "Private Builder",
      avatar: { kind: "preset", preset: "coral" },
      profileVisibility: "private",
      role: "member",
      commitmentCount: 4,
      submittedProofCount: 3,
      fullProfileAvailable: false
    });
  });

  it("shows only Pod-scoped identity for a private contributor", async () => {
    render(await PublicPodContributorPage({
      params: Promise.resolve({
        podId: "430296c7-9554-43e6-9b43-bfd063391028",
        handle: "private_builder"
      })
    }));

    expect(screen.getByRole("heading", { name: "Private Builder" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Public Pod activity" }))
      .toHaveTextContent("4commitments");
    expect(screen.getByRole("region", { name: "Public Pod activity" }))
      .toHaveTextContent("3public proofs");
    expect(screen.queryByRole("link", { name: "Open full profile" }))
      .not.toBeInTheDocument();
  });
});
