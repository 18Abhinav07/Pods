import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getPublicPodSurface,
  getPublicVisitorRoom,
  getWaitingRoomForUser,
  notFound,
  publicPodPageSession,
  redirect
} = vi.hoisted(() => ({
  getPublicPodSurface: vi.fn(async () => ({
    id: "430296c7-9554-43e6-9b43-bfd063391028",
    stage: "open",
    visitorRoomAvailable: false
  })),
  getPublicVisitorRoom: vi.fn(),
  getWaitingRoomForUser: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  publicPodPageSession: vi.fn(async () => null),
  redirect: vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  })
}));

vi.mock("next/navigation", () => ({
  notFound,
  redirect
}));

vi.mock("../src/lib/alpha-access-server", () => ({
  publicPodPageSession
}));

vi.mock("../src/lib/server-db", () => ({
  podsRepository: {
    getPublicPodSurface,
    getPublicVisitorRoom,
    getWaitingRoomForUser
  }
}));

vi.mock("../src/components/public-visitor-room", () => ({
  PublicVisitorRoom: ({ name }: { name: string }) => (
    <div>Visitor room: {name}</div>
  )
}));

import PodRoomPage from "../src/app/pods/[podId]/room/page";

describe("PodRoomPage public boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("PODS_PUBLIC_VISITOR_ROOMS_ENABLED", "true");
    publicPodPageSession.mockResolvedValue(null);
    getPublicPodSurface.mockResolvedValue({
      id: "430296c7-9554-43e6-9b43-bfd063391028",
      stage: "open",
      visitorRoomAvailable: false
    });
  });

  it("sends an anonymous open-public room URL to its canonical preview", async () => {
    await expect(
      PodRoomPage({
        params: Promise.resolve({
          podId: "430296c7-9554-43e6-9b43-bfd063391028"
        })
      })
    ).rejects.toThrow(
      "NEXT_REDIRECT:/pods/430296c7-9554-43e6-9b43-bfd063391028"
    );

    expect(publicPodPageSession).toHaveBeenCalledOnce();
    expect(getPublicPodSurface).toHaveBeenCalledWith(
      "430296c7-9554-43e6-9b43-bfd063391028",
      expect.any(Date)
    );
    expect(getPublicVisitorRoom).not.toHaveBeenCalled();
  });

  it("renders an anonymous read-only room only after an eligible roster lock", async () => {
    getPublicPodSurface.mockResolvedValue({
      id: "430296c7-9554-43e6-9b43-bfd063391028",
      stage: "live",
      visitorRoomAvailable: true
    });
    getPublicVisitorRoom.mockResolvedValue({
      pod: {
        id: "430296c7-9554-43e6-9b43-bfd063391028",
        name: "Build Pods in Public"
      },
      changeCursor: 8,
      lastSequence: 2,
      messages: []
    });

    render(await PodRoomPage({
      params: Promise.resolve({
        podId: "430296c7-9554-43e6-9b43-bfd063391028"
      })
    }));

    expect(screen.getByText("Visitor room: Build Pods in Public")).toBeVisible();
  });

  it("rejects a malformed room Pod ID before session or database access", async () => {
    await expect(
      PodRoomPage({
        params: Promise.resolve({ podId: "phase-zero-missing" })
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(publicPodPageSession).not.toHaveBeenCalled();
    expect(getPublicPodSurface).not.toHaveBeenCalled();
    expect(getPublicVisitorRoom).not.toHaveBeenCalled();
  });
});
