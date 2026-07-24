import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  getActivityOccurrenceForMember: vi.fn(),
  getActivityStreak: vi.fn(),
  getEffectiveTime: vi.fn()
}));
const redirect = vi.hoisted(() => vi.fn((href: string) => {
  throw new Error(`REDIRECT:${href}`);
}));

vi.mock("../src/lib/session", () => ({
  requireSession: vi.fn(async () => ({ userId: "user-1" }))
}));
vi.mock("../src/lib/server-db", () => ({
  podsRepository: repositoryMocks
}));
vi.mock("next/navigation", async (importOriginal) => {
  const original = await importOriginal<typeof import("next/navigation")>();
  return {
    ...original,
    useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
    redirect,
    notFound: vi.fn(() => {
      throw new Error("NOT_FOUND");
    })
  };
});

import ActivityOccurrencePage from "../src/app/pods/[podId]/activity/[occurrenceId]/page";

describe("template activity server page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repositoryMocks.getEffectiveTime.mockResolvedValue(
      new Date("2027-05-03T10:00:00.000Z")
    );
    repositoryMocks.getActivityStreak.mockResolvedValue(2);
  });

  it("dispatches a Reading editor from the frozen contract without a commitment cutoff", async () => {
    repositoryMocks.getActivityOccurrenceForMember.mockResolvedValue({
      membership: { id: "membership-1" },
      occurrence: {
        id: "occurrence-1",
        ordinal: 1,
        opensAt: new Date("2027-05-03T00:00:00.000Z"),
        closesAt: new Date("2027-05-03T23:59:59.999Z"),
        commitmentDeadlineAt: null
      },
      pod: {
        id: "pod-1",
        templateId: "reading",
        contractData: {
          version: 1,
          templateId: "reading",
          evidenceMode: "repeating_criterion",
          settlementMode: "proportional",
          activity: {
            name: "Read systems together",
            purpose: "Read and discuss one systems chapter every occurrence.",
            timeZone: "UTC",
            config: {
              bookOrTheme: "Designing Data-Intensive Applications",
              targetAmount: 20,
              targetType: "pages"
            }
          },
          community: { visibility: "public" },
          commitment: { lunaPerOccurrence: 10_000 }
        }
      },
      commitment: null,
      submission: null
    });

    render(await ActivityOccurrencePage({
      params: Promise.resolve({
        podId: "pod-1",
        occurrenceId: "occurrence-1"
      })
    }));

    expect(screen.getByLabelText("Reading title")).toBeInTheDocument();
    expect(screen.getByLabelText("Amount completed")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /lock/i })).not.toBeInTheDocument();
  });

  it("redirects a submitted occurrence to its canonical live submission route", async () => {
    repositoryMocks.getActivityOccurrenceForMember.mockResolvedValue({
      membership: { id: "membership-1" },
      occurrence: {
        id: "occurrence-1",
        ordinal: 1,
        opensAt: new Date("2027-05-03T00:00:00.000Z"),
        closesAt: new Date("2027-05-03T23:59:59.999Z"),
        commitmentDeadlineAt: null
      },
      pod: {
        id: "pod-1",
        templateId: "build",
        contractData: {
          version: 1,
          templateId: "build",
          evidenceMode: "per_occurrence_commitment",
          settlementMode: "full_refund_alpha",
          activity: {
            name: "Build Pods in public",
            purpose: "Ship one visible product improvement every occurrence.",
            timeZone: "UTC",
            config: {
              projectTheme: "Pods",
              allowedDeliverables: ["pull_request"]
            }
          },
          community: { visibility: "public" },
          commitment: { lunaPerOccurrence: 10_000 }
        }
      },
      commitment: {
        id: "commitment-1",
        task: "Ship the canonical participant submission route.",
        deliverableType: "pull_request",
        lockedAt: new Date("2027-05-03T08:00:00.000Z")
      },
      submission: {
        id: "submission-1",
        state: "reviewing"
      }
    });

    await expect(ActivityOccurrencePage({
      params: Promise.resolve({
        podId: "pod-1",
        occurrenceId: "occurrence-1"
      })
    })).rejects.toThrow(
      "REDIRECT:/pods/pod-1/submissions/submission-1"
    );
  });
});
