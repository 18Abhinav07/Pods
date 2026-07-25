import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getWaitingRoomForUser, redirect } = vi.hoisted(() => ({
  getWaitingRoomForUser: vi.fn(),
  redirect: vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  })
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect
}));

vi.mock("../src/lib/session", () => ({
  requireSession: vi.fn(async () => ({ userId: "user-1" }))
}));

vi.mock("../src/lib/server-db", () => ({
  podsRepository: { getWaitingRoomForUser }
}));

vi.mock("../src/components/pod-waiting-room", () => ({
  PodWaitingRoom: () => <div>Waiting room</div>
}));

import PodTodayPage from "../src/app/pods/[podId]/today/page";

const podId = "36f02245-a7a4-464d-ae2b-f7ca82f5740a";

function waitingRoom(
  state: string,
  settlementMode = "proportional",
  membershipState = "active"
) {
  return {
    pod: {
      id: podId,
      state,
      contractData: {
        settlementMode,
        activity: {
          name: "Build and Ship",
          purpose: "Ship one visible milestone.",
          weekdays: [1],
          timeZone: "UTC"
        },
        community: {
          minParticipants: 2,
          maxParticipants: 5
        },
        commitment: {
          lunaPerOccurrence: 10_000,
          totalLuna: 10_000,
          occurrenceCount: 1
        }
      }
    },
    viewerRole: "participant",
    membership: { state: membershipState },
    confirmedParticipants: 2,
    firstOccurrence: {
      opensAt: new Date("2027-04-05T00:00:00.000Z"),
      localDate: "2027-04-05"
    },
    refund: null
  };
}

describe("PodTodayPage lifecycle routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes active Pods into the room", async () => {
    getWaitingRoomForUser.mockResolvedValue(waitingRoom("active"));

    await expect(PodTodayPage({
      params: Promise.resolve({ podId })
    })).rejects.toThrow(`NEXT_REDIRECT:/pods/${podId}/room`);
  });

  it.each(["final_review", "completed"])(
    "routes a proportional %s Pod into settlement",
    async (state) => {
      getWaitingRoomForUser.mockResolvedValue(waitingRoom(state));

      await expect(PodTodayPage({
        params: Promise.resolve({ podId })
      })).rejects.toThrow(`NEXT_REDIRECT:/pods/${podId}/settlement`);
    }
  );

  it.each(["excluded_at_cutoff", "refund_pending", "refunded"])(
    "keeps a %s participant on the refund afterstate instead of settlement",
    async (membershipState) => {
      getWaitingRoomForUser.mockResolvedValue(
        waitingRoom("completed", "proportional", membershipState)
      );

      render(await PodTodayPage({
        params: Promise.resolve({ podId })
      }));

      expect(screen.getByText("Waiting room")).toBeVisible();
      expect(redirect).not.toHaveBeenCalled();
    }
  );

  it("keeps a refunding participant on the refund tracker after the Pod activates", async () => {
    getWaitingRoomForUser.mockResolvedValue(
      waitingRoom("active", "proportional", "refund_pending")
    );

    render(await PodTodayPage({
      params: Promise.resolve({ podId })
    }));

    expect(screen.getByText("Waiting room")).toBeVisible();
    expect(redirect).not.toHaveBeenCalled();
  });
});
