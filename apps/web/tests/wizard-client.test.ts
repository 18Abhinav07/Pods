import { describe, expect, it, vi } from "vitest";

import {
  createPodDraft,
  publishPodDraft,
  savePodDraftStep
} from "../src/lib/wizard-client";

describe("creator wizard API client", () => {
  it("uses explicit create, step, and publish contracts", async () => {
    const requests: Array<{ path: string; method: string; body: unknown }> = [];
    const fetcher = vi.fn(async (path: string, init?: RequestInit) => {
      requests.push({
        path,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : undefined
      });
      if (path === "/api/pods/drafts") {
        return new Response(JSON.stringify({ draft: { id: "pod-id" } }), { status: 201 });
      }
      return new Response(JSON.stringify({ pod: { id: "pod-id" } }), { status: 200 });
    });

    expect(await createPodDraft("build", fetcher)).toEqual({ id: "pod-id" });
    await savePodDraftStep("pod-id", "commitment", { nimPerOccurrence: "0.5" }, fetcher);
    await publishPodDraft("pod-id", fetcher);

    expect(requests).toEqual([
      {
        path: "/api/pods/drafts",
        method: "POST",
        body: { templateId: "build" }
      },
      {
        path: "/api/pods/drafts/pod-id",
        method: "PATCH",
        body: { step: "commitment", value: { nimPerOccurrence: "0.5" } }
      },
      {
        path: "/api/pods/drafts/pod-id/publish",
        method: "POST",
        body: { acceptedFrozenContract: true }
      }
    ]);
  });

  it("surfaces field errors from the server", async () => {
    const fetcher = async () =>
      new Response(JSON.stringify({ errors: ["Choose a commitment cutoff"] }), { status: 400 });
    await expect(createPodDraft("build", fetcher)).rejects.toThrow("Choose a commitment cutoff");
  });
});
