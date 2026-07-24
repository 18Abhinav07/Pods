import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PodRoom, shouldMarkConversationRead } from "../src/components/pod-room";

const messages = [
  {
    id: "message-1",
    sequence: 1,
    kind: "announcement" as const,
    body: "Ship room walkthrough at 8 PM.",
    replyToMessageId: null,
    replyPreview: null,
    hidden: false,
    pinned: true,
    createdAt: "2027-03-01T10:00:00.000Z",
    sender: {
      handle: "abhinav",
      displayName: "Abhinav",
      avatar: { kind: "preset" as const, preset: "ember" as const }
    },
    reactions: [{ code: "support" as const, count: 2, reactedByViewer: false }]
  },
  {
    id: "message-2",
    sequence: 2,
    kind: "member_message" as const,
    body: null,
    replyToMessageId: null,
    replyPreview: null,
    hidden: true,
    pinned: false,
    createdAt: "2027-03-01T10:02:00.000Z",
    sender: null,
    reactions: []
  }
];

describe("Pod room", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/messages") && init?.method === "POST") {
        return new Response(JSON.stringify({ message: { id: "saved", sequence: 3 } }), { status: 201 });
      }
      if (url.includes("/messages?")) {
        return new Response(JSON.stringify({ conversation: { lastSequence: 2 }, messages: [] }));
      }
      return new Response(JSON.stringify({}), { status: 200 });
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders distinct authoritative entries, existing reaction badges, and a visible tombstone", () => {
    render(
      <PodRoom
        conversationId="room-1"
        initialMessages={messages}
        initialLastSequence={2}
        isCreator
        podId="pod-1"
        roomState="open"
      />
    );
    expect(screen.getAllByText("Creator announcement")).toHaveLength(2);
    expect(screen.getByText("Pinned")).toBeInTheDocument();
    expect(screen.getByText("Ship room walkthrough at 8 PM.")).toBeInTheDocument();
    expect(screen.getByText("Message removed by the Pod creator")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Support 2/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Heart 0/i })).not.toBeInTheDocument();
  });

  it("renders participant-safe review labels and the owner's canonical detail action", () => {
    render(
      <PodRoom
        conversationId="room-1"
        initialMessages={[{
          ...messages[0]!,
          id: "activity-rejected",
          kind: "activity",
          body: null,
          sender: {
            ...messages[0]!.sender!,
            isViewer: true
          },
          activity: {
            commitmentId: "commitment-1",
            occurrenceOrdinal: 1,
            task: "Ship the private rejection projection.",
            deliverableType: "pull_request",
            templateId: "build",
            state: "rejected",
            submissionId: "submission-1",
            templateEvidence: {
              kind: "build",
              resultSummary: "Submitted a public artifact.",
              artifactUrl: "https://github.com/18Abhinav07/Pods/pull/43"
            },
            resultSummary: "Submitted a public artifact.",
            artifactUrl: "https://github.com/18Abhinav07/Pods/pull/43",
            sharedEvidenceAvailable: false
          }
        }]}
        initialLastSequence={1}
        isCreator={false}
        podId="pod-1"
        roomState="open"
      />
    );
    expect(screen.getByText("Not verified")).toBeVisible();
    expect(screen.queryByText("rejected")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View your submission" }))
      .toHaveAttribute("href", "/pods/pod-1/submissions/submission-1");
  });

  it("gives the creator a review action without exposing participant detail to peers", () => {
    const activityMessage = {
      ...messages[0]!,
      id: "activity-reviewing",
      kind: "activity" as const,
      body: null,
      sender: {
        ...messages[0]!.sender!,
        isViewer: false
      },
      activity: {
        commitmentId: "commitment-1",
        occurrenceOrdinal: 1,
        task: "Ship the creator review projection.",
        deliverableType: "pull_request",
        templateId: "build" as const,
        state: "reviewing",
        submissionId: "submission-1",
        templateEvidence: null,
        resultSummary: null,
        artifactUrl: null,
        sharedEvidenceAvailable: false
      }
    };
    const { rerender } = render(
      <PodRoom
        conversationId="room-1"
        initialMessages={[activityMessage]}
        initialLastSequence={1}
        canReviewProofs
        isCreator
        podId="pod-1"
        roomState="open"
      />
    );

    expect(screen.getByRole("link", { name: "Review proof" }))
      .toHaveAttribute("href", "/pods/pod-1/admin/reviews/submission-1");

    rerender(
      <PodRoom
        conversationId="room-1"
        initialMessages={[activityMessage]}
        initialLastSequence={1}
        canReviewProofs={false}
        isCreator
        podId="pod-1"
        roomState="open"
      />
    );

    expect(screen.queryByRole("link", { name: "Review proof" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View your submission" }))
      .not.toBeInTheDocument();

    rerender(
      <PodRoom
        conversationId="room-1"
        initialMessages={[activityMessage]}
        initialLastSequence={1}
        canReviewProofs={false}
        isCreator={false}
        podId="pod-1"
        roomState="open"
      />
    );
    expect(screen.queryByRole("link", { name: "Review proof" }))
      .not.toBeInTheDocument();
  });

  it("sends optimistically and exposes reply context", async () => {
    render(
      <PodRoom
        conversationId="room-1"
        initialMessages={messages.slice(0, 1)}
        initialLastSequence={1}
        isCreator={false}
        podId="pod-1"
        roomState="open"
        viewer={{
          handle: "viewer",
          displayName: "Current builder",
          avatar: { kind: "preset", preset: "moss" }
        }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "More actions for Abhinav" }));
    fireEvent.click(screen.getByRole("button", { name: "Reply" }));
    const composer = screen.getByRole("form", { name: "Send a room message" });
    expect(within(composer).getByText("Abhinav")).toBeInTheDocument();
    expect(within(composer).getByText("Ship room walkthrough at 8 PM.")).toBeInTheDocument();
    fireEvent.change(within(composer).getByLabelText("Message"), { target: { value: "The mobile room is ready." } });
    fireEvent.submit(composer);
    expect(screen.getByText("The mobile room is ready.")).toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: "Reply to Abhinav: Ship room walkthrough at 8 PM."
    })).toBeVisible();
    expect(screen.getByText("The mobile room is ready.").closest("article")).toHaveClass("is-viewer");
    expect(screen.getByText("Sending")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Sending")).not.toBeInTheDocument());
  });

  it("scrolls to and briefly highlights a loaded reply target", () => {
    vi.useFakeTimers();
    const scrollIntoView = vi.fn();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    render(
      <PodRoom
        conversationId="room-1"
        initialMessages={[
          messages[0]!,
          {
            ...messages[0]!,
            id: "message-3",
            sequence: 3,
            body: "The review path is open.",
            replyToMessageId: "message-1",
            replyPreview: {
              messageId: "message-1",
              sequence: 1,
              senderDisplayName: "Abhinav",
              kind: "announcement",
              excerpt: "Ship room walkthrough at 8 PM.",
              available: true
            }
          }
        ]}
        initialLastSequence={3}
        isCreator={false}
        podId="pod-1"
        roomState="open"
      />
    );

    fireEvent.click(screen.getByRole("button", {
      name: "Reply to Abhinav: Ship room walkthrough at 8 PM."
    }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
    expect(document.getElementById("message-1")).toHaveClass("is-reply-target");
    act(() => vi.advanceTimersByTime(1_200));
    expect(document.getElementById("message-1")).not.toHaveClass("is-reply-target");
  });

  it("loads an unavailable reply target around its message before scrolling", async () => {
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("around=message-1")) {
        return new Response(JSON.stringify({
          conversation: { lastSequence: 3 },
          messages: [messages[0]]
        }));
      }
      if (url.includes("/messages?") && !init?.method) {
        return new Response(JSON.stringify({ conversation: { lastSequence: 3 }, messages: [] }));
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });
    render(
      <PodRoom
        conversationId="room-1"
        initialMessages={[{
          ...messages[0]!,
          id: "message-3",
          sequence: 3,
          body: "The review path is open.",
          replyToMessageId: "message-1",
          replyPreview: {
            messageId: "message-1",
            sequence: 1,
            senderDisplayName: "Abhinav",
            kind: "announcement",
            excerpt: "Ship room walkthrough at 8 PM.",
            available: true
          }
        }]}
        initialLastSequence={3}
        isCreator={false}
        podId="pod-1"
        roomState="open"
      />
    );

    fireEvent.click(screen.getByRole("button", {
      name: "Reply to Abhinav: Ship room walkthrough at 8 PM."
    }));
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      "/api/conversations/room-1/messages?around=message-1&limit=40",
      { cache: "no-store" }
    );
  });

  it("renders an unavailable reply without an interactive target", () => {
    render(
      <PodRoom
        conversationId="room-1"
        initialMessages={[{
          ...messages[0]!,
          id: "message-4",
          body: "I saw the earlier update.",
          replyToMessageId: "message-hidden",
          replyPreview: {
            messageId: "message-hidden",
            sequence: 1,
            senderDisplayName: null,
            kind: "member_message",
            excerpt: "Message unavailable",
            available: false
          }
        }]}
        initialLastSequence={4}
        isCreator={false}
        podId="pod-1"
        roomState="open"
      />
    );
    expect(screen.getByText("Message unavailable")).toBeVisible();
    expect(screen.queryByRole("button", { name: /Reply to/ })).not.toBeInTheDocument();
  });

  it("redacts local reply previews when the creator hides their target", async () => {
    const original = {
      ...messages[0]!,
      id: "member-visible",
      kind: "member_message" as const,
      body: "This detail should disappear from every quote.",
      pinned: false
    };
    render(
      <PodRoom
        conversationId="room-1"
        initialMessages={[
          original,
          {
            ...messages[0]!,
            id: "reply-visible",
            sequence: 2,
            body: "Acknowledged.",
            replyToMessageId: original.id,
            replyPreview: {
              messageId: original.id,
              sequence: 1,
              senderDisplayName: "Abhinav",
              kind: "member_message",
              excerpt: original.body,
              available: true
            }
          }
        ]}
        initialLastSequence={2}
        isCreator
        podId="pod-1"
        roomState="open"
      />
    );

    const originalEntry = document.getElementById(original.id);
    expect(originalEntry).not.toBeNull();
    fireEvent.click(within(originalEntry!).getByRole("button", { name: "More actions for Abhinav" }));
    fireEvent.click(screen.getByRole("button", { name: "Hide message" }));
    await waitFor(() => expect(screen.getByText("Message unavailable")).toBeVisible());
    expect(screen.queryByText(original.body)).not.toBeInTheDocument();
  });

  it("degrades only a failed reply context to unavailable", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ error: "Not found" }), { status: 404 }));
    render(
      <PodRoom
        conversationId="room-1"
        initialMessages={[{
          ...messages[0]!,
          id: "reply-missing",
          body: "I remember the missing detail.",
          replyToMessageId: "missing-target",
          replyPreview: {
            messageId: "missing-target",
            sequence: 1,
            senderDisplayName: "Abhinav",
            kind: "member_message",
            excerpt: "Missing original",
            available: true
          }
        }]}
        initialLastSequence={2}
        isCreator={false}
        podId="pod-1"
        roomState="open"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Reply to Abhinav: Missing original" }));
    await waitFor(() => expect(screen.getByText("Message unavailable")).toBeVisible());
    expect(screen.getByText("I remember the missing detail.")).toBeVisible();
  });

  it("opens real Pod actions instead of exposing an inert plus control", () => {
    render(
      <PodRoom
        conversationId="room-1"
        initialMessages={[]}
        initialLastSequence={0}
        isCreator
        podId="pod-1"
        proofAction={{
          href: "/pods/pod-1/activity/occurrence-7",
          label: "Add today's proof"
        }}
        roomState="open"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Add to message" }));
    expect(screen.getByRole("link", { name: "Add today's proof" }))
      .toHaveAttribute("href", "/pods/pod-1/activity/occurrence-7");
    expect(screen.getByRole("link", { name: "Invite people" }))
      .toHaveAttribute("href", "/pods/pod-1/admin");
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveAttribute("placeholder", "Message");
    expect(screen.getByRole("button", { name: "Send message" })).toBeVisible();
  });

  it("uses a bottom-attached composer with an unambiguous send state", () => {
    render(
      <PodRoom
        conversationId="room-1"
        initialMessages={[]}
        initialLastSequence={0}
        isCreator={false}
        podId="pod-1"
        roomState="open"
      />
    );

    const composer = screen.getByRole("form", { name: "Send a room message" });
    const send = screen.getByRole("button", { name: "Send message" });
    expect(composer).toHaveClass("is-bottom-attached");
    expect(send).toBeDisabled();
    expect(send).toHaveClass("is-disabled");

    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
      target: { value: "Ready to ship." }
    });
    expect(send).toBeEnabled();
    expect(send).toHaveClass("is-ready");
  });

  it("lets the creator pin announcements and hide ordinary chat", async () => {
    render(
      <PodRoom
        conversationId="room-1"
        initialMessages={[
          { ...messages[0]!, pinned: false },
          {
            ...messages[0]!,
            id: "member-visible",
            kind: "member_message",
            body: "Casual message",
            pinned: false
          }
        ]}
        initialLastSequence={2}
        isCreator
        podId="pod-1"
        roomState="open"
      />
    );
    fireEvent.click(screen.getAllByRole("button", { name: "More actions for Abhinav" })[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Pin announcement" }));
    await waitFor(() => expect(screen.getByText("Pinned")).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole("button", { name: "More actions for Abhinav" })[1]!);
    fireEvent.click(screen.getByRole("button", { name: "Hide message" }));
    await waitFor(() => expect(screen.getByText("Message removed by the Pod creator")).toBeInTheDocument());
  });

  it("opens the same message actions through a touch long press", () => {
    vi.useFakeTimers();
    render(
      <PodRoom
        conversationId="room-1"
        initialMessages={messages.slice(0, 1)}
        initialLastSequence={1}
        isCreator={false}
        podId="pod-1"
        roomState="open"
      />
    );

    const entry = screen.getByText("Ship room walkthrough at 8 PM.").closest("article");
    expect(entry).not.toBeNull();
    fireEvent.pointerDown(entry!);
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByRole("dialog", { name: "Message actions" })).toBeVisible();
  });

  it("only advances the durable read cursor for a newer server sequence", () => {
    expect(shouldMarkConversationRead(2, 2)).toBe(false);
    expect(shouldMarkConversationRead(3, 2)).toBe(true);
  });

  it("turns the composer into an intentional archive state", () => {
    render(
      <PodRoom
        conversationId="room-1"
        initialMessages={[]}
        initialLastSequence={0}
        isCreator={false}
        podId="pod-1"
        roomState="archived"
      />
    );
    expect(screen.getByText("This room is a read-only archive.")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("renders direct conversations as compact viewer-aware chat", () => {
    const { container } = render(
      <PodRoom
        conversationId="direct-1"
        initialLastSequence={2}
        initialMessages={[
          {
            ...messages[0]!,
            id: "peer-message",
            kind: "member_message",
            body: "A short message from the other person.",
            sender: { ...messages[0]!.sender!, isViewer: false }
          },
          {
            ...messages[0]!,
            id: "viewer-message",
            kind: "member_message",
            body: "A short reply from me.",
            sender: { ...messages[0]!.sender!, isViewer: true }
          }
        ]}
        isCreator={false}
        mode="direct"
        podId=""
        roomState="open"
      />
    );

    expect(container.querySelector(".pod-room-panel.is-direct")).toBeInTheDocument();
    expect(container.querySelector("#viewer-message.is-viewer")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveAttribute("placeholder", "Message");
  });

  it("groups consecutive messages by sender and only repeats identity at the start", () => {
    const { container } = render(
      <PodRoom
        conversationId="room-1"
        initialLastSequence={3}
        initialMessages={[
          {
            ...messages[0]!,
            id: "first-note",
            kind: "member_message",
            body: "First part of the update.",
            sender: { ...messages[0]!.sender!, isViewer: false }
          },
          {
            ...messages[0]!,
            id: "second-note",
            sequence: 2,
            kind: "member_message",
            body: "Second part of the update.",
            sender: { ...messages[0]!.sender!, isViewer: false }
          },
          {
            ...messages[0]!,
            id: "viewer-note",
            sequence: 3,
            kind: "member_message",
            body: "Reply from me.",
            sender: { ...messages[0]!.sender!, isViewer: true }
          }
        ]}
        isCreator={false}
        podId="pod-1"
        roomState="open"
      />
    );

    expect(container.querySelector("#first-note")).toHaveClass("is-group-start");
    expect(container.querySelector("#second-note")).toHaveClass("is-consecutive", "is-group-end");
    expect(container.querySelector("#viewer-note")).toHaveClass("is-viewer", "is-group-start", "is-group-end");
    expect(screen.getAllByText("Abhinav")).toHaveLength(1);
  });

  it("morphs one activity entry into a group-safe proof card", () => {
    render(
      <PodRoom
        conversationId="room-1"
        initialLastSequence={1}
        initialMessages={[{
          ...messages[0]!,
          id: "activity-1",
          kind: "activity",
          activity: {
            commitmentId: "commitment-1",
            occurrenceOrdinal: 2,
            task: "Ship the responsive Pod room.",
            deliverableType: "pull_request",
            templateId: "build",
            state: "reviewing",
            submissionId: "submission-1",
            templateEvidence: {
              kind: "build",
              resultSummary: "The room now supports replies and reactions.",
              artifactUrl: "https://github.com/18Abhinav07/Pods/pull/8"
            },
            resultSummary: "The room now supports replies and reactions.",
            artifactUrl: "https://github.com/18Abhinav07/Pods/pull/8",
            sharedEvidenceAvailable: true
          }
        }]}
        isCreator={false}
        podId="pod-1"
        roomState="open"
      />
    );
    expect(screen.getByText("Occurrence 2")).toBeInTheDocument();
    expect(screen.getByText("Creator review")).toBeInTheDocument();
    const proofPath = "/api/pods/pod-1/submissions/submission-1/shared-evidence";
    expect(screen.getByRole("img", { name: "Pod-shared proof" })).toHaveAttribute("src", proofPath);
    expect(screen.getByRole("link", { name: "Open shared proof" })).toHaveAttribute("href", proofPath);
    expect(screen.getByText("Ship the responsive Pod room.").closest(".room-activity-main"))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open public artifact" })).toHaveAttribute(
      "href",
      "https://github.com/18Abhinav07/Pods/pull/8"
    );
  });
});
