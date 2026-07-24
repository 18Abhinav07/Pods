import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireSession = vi.hoisted(() => vi.fn());
const profileForSession = vi.hoisted(() => vi.fn());
const getCreatorSettlement = vi.hoisted(() => vi.fn());
const getParticipantSettlement = vi.hoisted(() => vi.fn());
const getEffectiveTime = vi.hoisted(() => vi.fn());
const listSettlementReadyPods = vi.hoisted(() => vi.fn());

vi.mock("../src/lib/session", () => ({ requireSession }));
vi.mock("../src/lib/profile-presentation", () => ({ profileForSession }));
vi.mock("../src/lib/server-db", () => ({
  podsRepository: {
    getCreatorSettlement,
    getParticipantSettlement,
    getEffectiveTime,
    listSettlementReadyPods
  }
}));
vi.mock("../src/components/app-header", () => ({
  AppHeader: () => <header>Settlement</header>
}));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("not found");
  }),
  useRouter: () => ({ refresh: vi.fn() })
}));

import SettlementPage from "../src/app/pods/[podId]/settlement/page";

const podId = "430296c7-9554-43e6-9b43-bfd063391028";

describe("settlement page finalization gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue({ userId: "creator-1" });
    profileForSession.mockResolvedValue({});
    getParticipantSettlement.mockResolvedValue(null);
    getEffectiveTime.mockResolvedValue(new Date("2027-05-04T00:00:00.000Z"));
    getCreatorSettlement.mockResolvedValue({
      pod: {
        id: podId,
        state: "final_review",
        contractData: {
          activity: { name: "Pods build in public" }
        }
      },
      settlement: null,
      occurrences: [],
      entitlements: []
    });
  });

  it("hides Finalize now while any outcome remains non-terminal", async () => {
    listSettlementReadyPods.mockResolvedValue([]);

    render(await SettlementPage({ params: Promise.resolve({ podId }) }));

    expect(screen.queryByRole("button", { name: "Finalize now" })).not.toBeInTheDocument();
    expect(screen.getByText("Settlement is ready when review closes.")).toBeVisible();
  });

  it("shows Finalize now only after the canonical readiness query passes", async () => {
    listSettlementReadyPods.mockResolvedValue([{ id: podId }]);

    render(await SettlementPage({ params: Promise.resolve({ podId }) }));

    expect(screen.getByRole("button", { name: "Finalize now" })).toBeVisible();
  });
});
