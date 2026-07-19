import { describe, expect, it, vi } from "vitest";

import { cancelEnrollmentPod, decidePodApplication } from "../src/lib/creator-enrollment-client";

describe("creator enrollment commands", () => {
  it("sends an explicit application decision to the scoped application", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ application: { state: "accepted_unfunded" } }), { status: 200 }));

    await expect(decidePodApplication("pod-1", "app-1", "accept", fetcher)).resolves.toMatchObject({ state: "accepted_unfunded" });
    expect(fetcher).toHaveBeenCalledWith("/api/pods/pod-1/applications/app-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision: "accept" })
    });
  });

  it("requires the creator to send an explicit cancellation command", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ pod: { state: "cancelled" } }), { status: 200 }));

    await expect(cancelEnrollmentPod("pod-1", fetcher)).resolves.toMatchObject({ state: "cancelled" });
    expect(fetcher).toHaveBeenCalledWith("/api/pods/pod-1/cancel", { method: "POST" });
  });
});
