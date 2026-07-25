import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, replace }) }));

import { ActivityOccurrence } from "../src/components/activity-occurrence";

const base = {
  podId: "pod-1",
  occurrenceId: "occurrence-1",
  podName: "Build Pods in Public",
  projectTheme: "A polished accountability product",
  allowedDeliverables: ["pull_request", "commit"] as const,
  occurrenceOrdinal: 1,
  opensAt: "2027-04-05T00:00:00.000Z",
  initiallyOpen: true,
  commitmentDeadlineAt: "2027-04-05T09:00:00.000Z",
  closesAt: "2027-04-05T23:59:59.999Z",
  stakeNim: 0.1,
  settlementMode: "full_refund_alpha" as const,
  currentStreak: 0,
  timeZone: "UTC",
  effectiveNowAt: "2027-04-05T00:00:00.000Z"
};

describe("Build and Ship occurrence", () => {
  beforeEach(() => {
    refresh.mockReset();
    replace.mockReset();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("opens with an editorial commitment signal before the Build wizard", () => {
    render(<ActivityOccurrence {...base} commitment={null} submission={null} />);

    expect(screen.getByRole("heading", {
      name: "Choose the one thing you will ship."
    })).toBeInTheDocument();
    expect(screen.getByText("Commitment window open")).toBeInTheDocument();
    expect(screen.getByText("A polished accountability product")).toBeInTheDocument();
    expect(screen.getByText("Apr 5 · 9:00 AM")).toBeInTheDocument();
    expect(screen.getByText("Activity slice")).toBeInTheDocument();
    expect(screen.getByText("Your full Testnet principal remains returnable."))
      .toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Commitment progress" }))
      .not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start commitment" }));

    expect(screen.getByRole("heading", {
      name: "What will be true when today is done?"
    })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Commitment progress" }))
      .toBeInTheDocument();
  });

  it("keeps a future occurrence read-only until its opening instant", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2035-12-31T23:59:58.000Z"));
    render(
      <ActivityOccurrence
        {...base}
        commitment={null}
        effectiveNowAt="2027-04-05T07:59:58.000Z"
        initiallyOpen={false}
        opensAt="2027-04-05T08:00:00.000Z"
        submission={null}
      />
    );

    expect(screen.getByText("Commitment opens soon")).toBeInTheDocument();
    expect(screen.getByText("Starts in")).toBeInTheDocument();
    expect(screen.getByText("Apr 5 · 8:00 AM")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Commitment not open" }))
      .toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(screen.getByText("Commitment window open")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start commitment" }))
      .toBeEnabled();
  });

  it("closes an open commitment from elapsed audited time despite a skewed browser clock", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2035-12-31T23:59:58.000Z"));
    render(
      <ActivityOccurrence
        {...base}
        commitment={null}
        effectiveNowAt="2027-04-05T08:59:58.000Z"
        initiallyOpen
        opensAt="2027-04-05T08:00:00.000Z"
        submission={null}
      />
    );

    expect(screen.getByText("Commitment window open")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start commitment" }))
      .toBeEnabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(screen.getByText("Commitment window closed")).toBeInTheDocument();
    expect(screen.getByText("Closed at")).toBeInTheDocument();
    expect(screen.getByText("Apr 5 · 9:00 AM")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Commitment closed" }))
      .toBeDisabled();
  });

  it("renders an initially expired commitment as closed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2001-01-01T00:00:00.000Z"));
    render(
      <ActivityOccurrence
        {...base}
        commitment={null}
        effectiveNowAt="2027-04-05T09:05:00.000Z"
        initiallyOpen={false}
        opensAt="2027-04-05T08:00:00.000Z"
        submission={null}
      />
    );

    expect(screen.getByText("Commitment window closed")).toBeInTheDocument();
    expect(screen.getByText("Apr 5 · 9:00 AM")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Commitment closed" }))
      .toBeDisabled();
    expect(screen.queryByRole("button", { name: "Start commitment" }))
      .not.toBeInTheDocument();
  });

  it("keeps the Build promise and proof choice while moving back through the wizard", () => {
    render(<ActivityOccurrence {...base} commitment={null} submission={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Start commitment" }));

    fireEvent.change(screen.getByLabelText("Today I will"), {
      target: { value: "Ship the complete mobile proof composer." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Choose proof" }));
    expect(screen.getByRole("heading", {
      name: "How will the room know?"
    })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /GitHub commit/i }));
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));

    expect(screen.getByLabelText("Today I will"))
      .toHaveValue("Ship the complete mobile proof composer.");

    fireEvent.click(screen.getByRole("button", { name: "Choose proof" }));
    expect(screen.getByRole("radio", { name: /GitHub commit/i })).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Review commitment" }));

    expect(screen.getByRole("heading", { name: "Make it real." }))
      .toBeInTheDocument();
    expect(screen.getByText("Ship the complete mobile proof composer."))
      .toBeInTheDocument();
    expect(screen.getByText("Occurrence 01")).toBeInTheDocument();
    expect(screen.getByText("0.1 NIM")).toBeInTheDocument();
    expect(screen.getByText("GitHub commit")).toBeInTheDocument();
    expect(screen.getByText("Apr 5 · 11:59 PM")).toBeInTheDocument();
    expect(screen.getByText("Step 3 of 3, Lock")).toBeInTheDocument();
  });

  it("does not lock from an intermediate form submission", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    );
    const { container } = render(
      <ActivityOccurrence {...base} commitment={null} submission={null} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Start commitment" }));
    fireEvent.change(screen.getByLabelText("Today I will"), {
      target: { value: "Ship the complete mobile proof composer." }
    });

    await act(async () => {
      fireEvent.submit(container.querySelector("form")!);
      await Promise.resolve();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("locks once, shows a purposeful success handoff, then continues to proof", async () => {
    const locked = {
      id: "commitment-1",
      task: "Ship the complete mobile proof composer.",
      deliverableType: "pull_request",
      lockedAt: "2027-04-05T08:00:00.000Z"
    } as const;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ commitment: locked }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      })
    );
    render(<ActivityOccurrence {...base} commitment={null} submission={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Start commitment" }));
    fireEvent.change(screen.getByLabelText("Today I will"), {
      target: { value: locked.task }
    });
    fireEvent.click(screen.getByRole("button", { name: "Choose proof" }));
    fireEvent.click(screen.getByRole("button", { name: "Review commitment" }));
    fireEvent.click(screen.getByRole("button", { name: "Lock this commitment" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/pods/pod-1/occurrences/occurrence-1/commitment",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          task: locked.task,
          deliverableType: "pull_request"
        })
      })
    ));
    expect(await screen.findByRole("heading", { name: "Commitment locked." }))
      .toBeInTheDocument();
    expect(screen.getByText(locked.task)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Pod room" }))
      .toHaveAttribute("href", "/pods/pod-1/room");
    expect(refresh).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Continue to proof" }));
    expect(screen.getByRole("heading", { name: "What did you finish?" }))
      .toBeInTheDocument();
  });

  it("uses a distinct Create ritual and promise check", () => {
    render(
      <ActivityOccurrence
        {...base}
        allowedDeliverables={[]}
        commitment={null}
        projectTheme="Daily illustration practice"
        submission={null}
        templateConfig={{ discipline: "Illustration" }}
        templateId="create"
      />
    );

    expect(screen.getByRole("heading", {
      name: "Choose the one thing you will make."
    })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start commitment" }));
    fireEvent.change(screen.getByLabelText("Today I will make"), {
      target: { value: "Finish one complete character color study." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Check promise" }));

    expect(screen.getByRole("heading", { name: "Check the promise." }))
      .toBeInTheDocument();
    expect(screen.getByText("Daily illustration practice")).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("sends repeating templates directly to proof without a commitment entry", () => {
    render(
      <ActivityOccurrence
        {...base}
        allowedDeliverables={[]}
        commitment={null}
        projectTheme="Morning run"
        submission={null}
        templateConfig={{
          activityType: "Running",
          measurableMinimum: "Run 3 kilometres"
        }}
        templateId="fitness"
      />
    );

    expect(screen.getByRole("heading", { name: "What did you finish?" }))
      .toBeInTheDocument();
    expect(screen.getByLabelText("Completion note")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start commitment" }))
      .not.toBeInTheDocument();
  });

  it("opens an existing commitment directly in proof", () => {
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

    expect(screen.getByRole("heading", { name: "What did you finish?" }))
      .toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Commitment locked." }))
      .not.toBeInTheDocument();
  });

  it("creates the draft and submits it through the staged proof composer", async () => {
    const draft = {
      id: "submission-1",
      state: "draft",
      resultSummary: "Shipped the complete participant activity screen and tests.",
      artifactUrl: "https://github.com/18Abhinav07/Pods/pull/42",
      evidenceAvailable: false,
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
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add artifact link" }));
    fireEvent.change(screen.getByLabelText("Public artifact URL"), {
      target: { value: "https://github.com/18Abhinav07/Pods/pull/42" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to visibility" }));
    expect(
      fireEvent.click(screen.getByRole("button", { name: "Review submission" }))
    ).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Submit to creator" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/pods/pod-1/occurrences/occurrence-1/draft",
      expect.objectContaining({ method: "POST" })
    ));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/pods/pod-1/submissions/submission-1/submit",
      { method: "POST" }
    ));
    await waitFor(() => expect(replace).toHaveBeenCalledWith(
      "/pods/pod-1/submissions/submission-1"
    ));
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
      evidenceAvailable: false,
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
      evidenceAvailable: false,
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
      evidenceAvailable: false,
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
        submission: { ...submission, evidenceAvailable: true }
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

    expect(container.querySelector("[data-proof-wizard]")).toBeInTheDocument();
    expect(container.querySelector("[data-flow-stage]")).toBeInTheDocument();
    expect(container.querySelector(".activity-evidence-card")).not.toBeInTheDocument();
    expect(container.querySelector(".flow-stage")).not.toBeInTheDocument();
    expect(container.querySelector(".proof-stage-heading")).not.toBeInTheDocument();
    expect(screen.getByText("Step 1 of 4, Result")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Proof progress" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /Creator only/i }))
      .not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Result summary"), {
      target: { value: "Shipped the complete participant activity screen and tests." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to evidence" }));
    expect(screen.getByText("Step 2 of 4, Evidence")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Camera/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Image/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add artifact link" }))
      .toBeInTheDocument();
    expect(container.querySelectorAll("input.proof-file-input")).toHaveLength(2);
  });

  it("keeps submit exclusive to the final review step", () => {
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

    expect(screen.queryByRole("button", { name: "Submit to creator" }))
      .not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Result summary"), {
      target: { value: "Shipped the complete participant activity screen and tests." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to evidence" }));
    fireEvent.click(screen.getByRole("button", { name: "Add artifact link" }));
    fireEvent.change(screen.getByLabelText("Public artifact URL"), {
      target: { value: "https://github.com/example/pods/pull/42" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to visibility" }));
    expect(screen.getByText("Step 3 of 4, Visibility")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit to creator" }))
      .not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Review submission" }));
    expect(screen.getByText("Step 4 of 4, Review")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit to creator" }))
      .toBeInTheDocument();
  });

  it("submits legacy reviews to the effective Pods Team authority", () => {
    render(<ActivityOccurrence
      {...base}
      commitment={{
        id: "commitment-1",
        task: "Ship the participant activity screen and its tests.",
        deliverableType: "pull_request",
        lockedAt: "2027-04-05T08:00:00.000Z"
      }}
      reviewerKind="pods_team"
      submission={null}
    />);

    fireEvent.change(screen.getByLabelText("Result summary"), {
      target: { value: "Shipped the complete participant activity screen and tests." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to evidence" }));
    fireEvent.click(screen.getByRole("button", { name: "Add artifact link" }));
    fireEvent.change(screen.getByLabelText("Public artifact URL"), {
      target: { value: "https://github.com/example/pods/pull/42" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to visibility" }));
    expect(screen.getByRole("radio", { name: /Pods Team only/i })).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Review submission" }));
    expect(screen.getByText("Pods Team", { exact: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit to Pods Team" }))
      .toBeInTheDocument();
  });

  it("clears an unconfirmed preview after an interrupted upload", async () => {
    class FailedXmlHttpRequest {
      static instance: FailedXmlHttpRequest | null = null;
      upload = { onprogress: null as ((event: ProgressEvent) => void) | null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      status = 0;
      responseText = "";

      constructor() {
        FailedXmlHttpRequest.instance = this;
      }

      open() {}
      send() {}
      abort() {}
    }
    vi.stubGlobal("XMLHttpRequest", FailedXmlHttpRequest);
    const NativeUrl = URL;
    const revokeObjectURL = vi.fn();
    const FakeUrl = class extends NativeUrl {};
    Object.assign(FakeUrl, {
      createObjectURL: () => "blob:failed-proof",
      revokeObjectURL
    });
    vi.stubGlobal("URL", FakeUrl);
    const submission = {
      id: "submission-1",
      state: "draft",
      resultSummary: "Shipped the complete participant activity screen and tests.",
      artifactUrl: "https://github.com/example/pods/pull/42",
      evidenceAvailable: false,
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
    fireEvent.change(screen.getByLabelText("Choose evidence image"), {
      target: { files: [new File(["proof"], "proof.png", { type: "image/png" })] }
    });
    expect(screen.getByText("Image selected")).toBeInTheDocument();

    await act(async () => {
      FailedXmlHttpRequest.instance?.onerror?.();
    });

    expect(screen.queryByText("Image selected")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose image" }))
      .toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Choose the image again");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:failed-proof");
  });

  it("restores confirmed evidence after a replacement upload fails", async () => {
    class FailedXmlHttpRequest {
      static instance: FailedXmlHttpRequest | null = null;
      upload = { onprogress: null as ((event: ProgressEvent) => void) | null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      status = 500;
      responseText = JSON.stringify({ error: "Upload rejected" });

      constructor() {
        FailedXmlHttpRequest.instance = this;
      }

      open() {}
      send() {}
      abort() {}
    }
    vi.stubGlobal("XMLHttpRequest", FailedXmlHttpRequest);
    const NativeUrl = URL;
    const FakeUrl = class extends NativeUrl {};
    Object.assign(FakeUrl, {
      createObjectURL: () => "blob:replacement",
      revokeObjectURL: vi.fn()
    });
    vi.stubGlobal("URL", FakeUrl);
    const submission = {
      id: "submission-1",
      state: "draft",
      resultSummary: "Shipped the complete participant activity screen and tests.",
      artifactUrl: "https://github.com/example/pods/pull/42",
      evidenceAvailable: true,
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
    fireEvent.click(screen.getByRole("button", { name: "Replace image" }));
    fireEvent.change(screen.getByLabelText("Choose evidence image"), {
      target: { files: [new File(["proof"], "replacement.png", { type: "image/png" })] }
    });

    await act(async () => {
      FailedXmlHttpRequest.instance?.onload?.();
    });

    expect(screen.getByText("Image secured")).toBeInTheDocument();
    expect(screen.getByAltText("Selected proof preview")).toHaveAttribute(
      "src",
      "/api/pods/pod-1/submissions/submission-1/evidence"
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Choose the image again");
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
    "reviewing",
    "approved",
    "rejected",
    "timeout_protected"
  ] as const)(
    "does not duplicate the canonical %s submission detail",
    (state) => {
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
            evidenceAvailable: false,
            proofShareMode: "reviewer_only"
          }}
        />
      );

      expect(screen.getByRole("status")).toHaveTextContent(
        "Opening your live submission"
      );
      expect(screen.queryByText("Creator review in progress"))
        .not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /appeal|dispute/i }))
        .not.toBeInTheDocument();
    }
  );
});
