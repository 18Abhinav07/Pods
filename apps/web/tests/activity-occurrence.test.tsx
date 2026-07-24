import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { ActivityOccurrence } from "../src/components/activity-occurrence";

const base = {
  podId: "pod-1",
  occurrenceId: "occurrence-1",
  podName: "Build Pods in Public",
  projectTheme: "A polished accountability product",
  allowedDeliverables: ["pull_request", "commit"] as const,
  occurrenceOrdinal: 1,
  commitmentDeadlineAt: "2027-04-05T09:00:00.000Z",
  closesAt: "2027-04-05T23:59:59.999Z",
  stakeNim: 0.1,
  settlementMode: "full_refund_alpha" as const,
  currentStreak: 0,
  timeZone: "UTC"
};

describe("Build and Ship occurrence", () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("reveals one commitment decision at a time before the final lock", () => {
    const { container } = render(<ActivityOccurrence {...base} commitment={null} submission={null} />);

    expect(screen.getByText("A polished accountability product")).toBeInTheDocument();
    expect(screen.getByText("Apr 5 · 11:59 PM")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Name today's finish." }))
      .toBeInTheDocument();
    expect(screen.queryByText("Visible deliverable")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lock this task" }))
      .not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Today's task"), {
      target: { value: "Ship the complete mobile proof composer." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Choose proof type" }));
    expect(screen.getByRole("heading", {
      name: "Choose how the work will be verified."
    })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "GitHub pull request" }));
    fireEvent.click(screen.getByRole("button", { name: "Review commitment" }));
    expect(screen.getByRole("heading", { name: "Make it official." }))
      .toBeInTheDocument();
    expect(screen.getByText("Ship the complete mobile proof composer."))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lock this task" }))
      .toBeInTheDocument();
    expect(screen.getByText("Once locked, this task cannot be changed for this occurrence."))
      .toBeInTheDocument();
    expect(container.querySelector(".activity-contract-card")).toHaveClass("is-guided-flow");
    expect(container.querySelector(".commitment-studio-visual")).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Commitment progress" })).toBeInTheDocument();
    expect(container.querySelectorAll(".flow-progress-dot")).toHaveLength(3);
  });

  it("states the full-return alpha consequence without implying principal is at risk", () => {
    render(<ActivityOccurrence {...base} commitment={null} submission={null} />);

    expect(screen.getByText("Activity slice")).toBeInTheDocument();
    expect(screen.getByText("Your full Testnet principal remains returnable.")).toBeInTheDocument();
    expect(screen.queryByText("At risk")).not.toBeInTheDocument();
  });

  it("creates the draft and submits it through the staged proof composer", async () => {
    const draft = {
      id: "submission-1",
      state: "draft",
      resultSummary: "Shipped the complete participant activity screen and tests.",
      artifactUrl: "https://github.com/18Abhinav07/Pods/pull/42",
      evidenceObjectKey: null,
      proofShareMode: "reviewer_only"
    } as const;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      return new Response(JSON.stringify({
        submission: url.endsWith("/submit") ? { ...draft, state: "reviewing" } : draft
      }), { status: url.endsWith("/submit") ? 200 : 201, headers: { "Content-Type": "application/json" } });
    });
    render(<ActivityOccurrence
      {...base}
      commitment={{
        id: "commitment-1",
        task: "Ship the participant activity screen and its tests.",
        deliverableType: "pull_request",
        lockedAt: "2027-04-05T08:00:00.000Z"
      }}
      submission={null}
    />);
    fireEvent.change(screen.getByLabelText("Result summary"), {
      target: { value: "Shipped the complete participant activity screen and tests." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to evidence" }));
    fireEvent.click(screen.getByRole("button", { name: "Add artifact link" }));
    fireEvent.change(screen.getByLabelText("Public artifact URL"), {
      target: { value: "https://github.com/18Abhinav07/Pods/pull/42" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to visibility" }));
    fireEvent.click(screen.getByRole("button", { name: "Review submission" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit to creator" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/pods/pod-1/occurrences/occurrence-1/draft",
      expect.objectContaining({ method: "POST" })
    ));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/pods/pod-1/submissions/submission-1/submit",
      { method: "POST" }
    ));
    expect(await screen.findByText("Creator review in progress")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
  });

  it("serializes autosaves so an older draft cannot overwrite newer evidence", async () => {
    vi.useFakeTimers();
    let releaseFirstSave!: (response: Response) => void;
    const firstSave = new Promise<Response>((resolve) => {
      releaseFirstSave = resolve;
    });
    const draft = {
      id: "submission-1",
      state: "draft",
      resultSummary: "First complete result summary for the activity.",
      artifactUrl: "",
      evidenceObjectKey: null,
      proofShareMode: "reviewer_only"
    } as const;
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => firstSave)
      .mockResolvedValueOnce(new Response(JSON.stringify({
        submission: {
          ...draft,
          resultSummary: "Second complete result summary for the activity."
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }));

    render(
      <ActivityOccurrence
        {...base}
        commitment={{
          id: "commitment-1",
          task: "Ship the participant activity screen and its tests.",
          deliverableType: "pull_request",
          lockedAt: "2027-04-05T08:00:00.000Z"
        }}
        submission={null}
      />
    );

    fireEvent.change(screen.getByLabelText("Result summary"), {
      target: { value: "First complete result summary for the activity." }
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText("Result summary"), {
      target: { value: "Second complete result summary for the activity." }
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      releaseFirstSave(new Response(JSON.stringify({ submission: draft }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not submit when mobile enter triggers the form before final review", async () => {
    const draft = {
      id: "submission-1",
      state: "draft",
      resultSummary: "Shipped the complete participant activity screen and tests.",
      artifactUrl: "https://github.com/18Abhinav07/Pods/pull/42",
      evidenceObjectKey: null,
      proofShareMode: "reviewer_only"
    } as const;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ submission: draft }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      })
    );
    const { container } = render(
      <ActivityOccurrence
        {...base}
        commitment={{
          id: "commitment-1",
          task: "Ship the participant activity screen and its tests.",
          deliverableType: "pull_request",
          lockedAt: "2027-04-05T08:00:00.000Z"
        }}
        submission={null}
      />
    );

    fireEvent.change(screen.getByLabelText("Result summary"), {
      target: { value: "Shipped the complete participant activity screen and tests." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to evidence" }));
    fireEvent.click(screen.getByRole("button", { name: "Add artifact link" }));
    fireEvent.change(screen.getByLabelText("Public artifact URL"), {
      target: { value: "https://github.com/18Abhinav07/Pods/pull/42" }
    });

    await act(async () => {
      fireEvent.submit(container.querySelector("form")!);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock.mock.calls.some(([input]) => String(input).endsWith("/submit")))
      .toBe(false);
  });

  it("validates a Build artifact against the locked deliverable before review", () => {
    render(
      <ActivityOccurrence
        {...base}
        commitment={{
          id: "commitment-1",
          task: "Ship the participant activity screen and its tests.",
          deliverableType: "pull_request",
          lockedAt: "2027-04-05T08:00:00.000Z"
        }}
        submission={null}
      />
    );

    fireEvent.change(screen.getByLabelText("Result summary"), {
      target: { value: "Shipped the complete participant activity screen and tests." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to evidence" }));
    fireEvent.click(screen.getByRole("button", { name: "Add artifact link" }));
    fireEvent.change(screen.getByLabelText("Public artifact URL"), {
      target: { value: "https://github.com/18Abhinav07/Pods/issues/42" }
    });

    expect(
      screen.getByText("Add a GitHub pull request URL that matches the locked deliverable")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue to visibility" }))
      .toBeDisabled();
  });

  it("aborts a stale image upload and ignores its late completion", async () => {
    class FakeXmlHttpRequest {
      static instances: FakeXmlHttpRequest[] = [];
      upload = { onprogress: null as ((event: ProgressEvent) => void) | null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      status = 0;
      responseText = "";
      aborted = false;

      constructor() {
        FakeXmlHttpRequest.instances.push(this);
      }

      open() {}
      send() {}
      abort() {
        this.aborted = true;
      }
    }
    vi.stubGlobal("XMLHttpRequest", FakeXmlHttpRequest);
    const NativeUrl = URL;
    const FakeUrl = class extends NativeUrl {};
    Object.assign(FakeUrl, {
      createObjectURL: (file: File) => `blob:${file.name}`,
      revokeObjectURL: vi.fn()
    });
    vi.stubGlobal("URL", FakeUrl);
    const submission = {
      id: "submission-1",
      state: "draft",
      resultSummary: "Shipped the complete participant activity screen and tests.",
      artifactUrl: "https://github.com/18Abhinav07/Pods/pull/42",
      evidenceObjectKey: null,
      proofShareMode: "reviewer_only"
    } as const;

    render(
      <ActivityOccurrence
        {...base}
        commitment={{
          id: "commitment-1",
          task: "Ship the participant activity screen and its tests.",
          deliverableType: "pull_request",
          lockedAt: "2027-04-05T08:00:00.000Z"
        }}
        submission={submission}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Continue to evidence" }));
    const input = screen.getByLabelText("Choose evidence image");
    fireEvent.change(input, {
      target: { files: [new File(["first"], "first.png", { type: "image/png" })] }
    });
    fireEvent.change(input, {
      target: { files: [new File(["second"], "second.png", { type: "image/png" })] }
    });

    expect(FakeXmlHttpRequest.instances).toHaveLength(2);
    expect(FakeXmlHttpRequest.instances[0]?.aborted).toBe(true);

    await act(async () => {
      const stale = FakeXmlHttpRequest.instances[0]!;
      stale.status = 200;
      stale.responseText = JSON.stringify({
        submission: { ...submission, evidenceObjectKey: "first.png" }
      });
      stale.onload?.();
    });
    expect(screen.getByText("Image selected")).toBeInTheDocument();
    expect(screen.queryByText("Image secured")).not.toBeInTheDocument();
  });

  it("keeps evidence and visibility as separate proof steps", () => {
    const { container } = render(<ActivityOccurrence
      {...base}
      commitment={{
        id: "commitment-1",
        task: "Ship the participant activity screen and its tests.",
        deliverableType: "pull_request",
        lockedAt: "2027-04-05T08:00:00.000Z"
      }}
      submission={null}
    />);

    expect(container.querySelector(".activity-evidence-card")).toHaveClass("is-guided-flow");
    expect(screen.getByRole("navigation", { name: "Proof progress" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /Creator only/i }))
      .not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Result summary"), {
      target: { value: "Shipped the complete participant activity screen and tests." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to evidence" }));
    expect(screen.getByRole("button", { name: /Camera/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Image/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add artifact link" }))
      .toBeInTheDocument();
    expect(container.querySelectorAll("input.proof-file-input")).toHaveLength(2);
  });

  it("offers public image sharing only for a visitor-enabled frozen contract", () => {
    const commitment = {
      id: "commitment-1",
      task: "Ship the participant activity screen and its tests.",
      deliverableType: "pull_request" as const,
      lockedAt: "2027-04-05T08:00:00.000Z"
    };
    const first = render(
      <ActivityOccurrence {...base} commitment={commitment} submission={null} />
    );
    fireEvent.change(screen.getByLabelText("Result summary"), {
      target: { value: "Shipped the complete participant activity screen and tests." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to evidence" }));
    fireEvent.click(screen.getByRole("button", { name: "Add artifact link" }));
    fireEvent.change(screen.getByLabelText("Public artifact URL"), {
      target: { value: "https://github.com/example/pods/pull/42" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to visibility" }));
    expect(screen.queryByRole("radio", { name: /Share publicly/i }))
      .not.toBeInTheDocument();
    first.unmount();

    render(
      <ActivityOccurrence
        {...base}
        commitment={commitment}
        publicVisitorSharingEnabled
        submission={null}
      />
    );
    fireEvent.change(screen.getByLabelText("Result summary"), {
      target: { value: "Shipped the complete participant activity screen and tests." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to evidence" }));
    fireEvent.click(screen.getByRole("button", { name: "Add artifact link" }));
    fireEvent.change(screen.getByLabelText("Public artifact URL"), {
      target: { value: "https://github.com/example/pods/pull/42" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to visibility" }));
    expect(screen.getByRole("radio", { name: /Share publicly/i }))
      .toBeInTheDocument();
  });

  it.each([
    [
      "reviewing",
      "Creator review in progress",
      "The Pod creator is checking your proof against the locked commitment."
    ],
    [
      "approved",
      "Work approved",
      "The Pod creator approved this proof. It counts toward your progress and streak."
    ],
    [
      "rejected",
      "Not verified",
      "The Pod creator did not verify this proof against the locked commitment."
    ],
    [
      "timeout_protected",
      "Protected after review timeout",
      "The creator did not decide within 24 hours. This occurrence counts toward your progress and streak."
    ]
  ] as const)(
    "renders the participant-safe %s terminal projection",
    (state, heading, detail) => {
      render(
        <ActivityOccurrence
          {...base}
          commitment={{
            id: "commitment-1",
            task: "Ship the participant activity screen and its tests.",
            deliverableType: "pull_request",
            lockedAt: "2027-04-05T08:00:00.000Z"
          }}
          submission={{
            id: "submission-1",
            state,
            resultSummary: "Shipped the participant activity screen and its tests.",
            artifactUrl: "https://github.com/example/pods/pull/42",
            evidenceObjectKey: null,
            proofShareMode: "reviewer_only"
          }}
        />
      );

      expect(screen.getByRole("heading", { name: heading })).toBeVisible();
      expect(screen.getByText(detail)).toBeVisible();
      expect(screen.queryByRole("button", { name: /appeal|dispute/i }))
        .not.toBeInTheDocument();
    }
  );
});
