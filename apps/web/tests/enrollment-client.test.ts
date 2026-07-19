import { describe, expect, it, vi } from "vitest";

import { submitPublicApplication } from "../src/lib/enrollment-client";

describe("submitPublicApplication", () => {
  it("sends only answer values to the Pod-scoped application endpoint", async () => {
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ application: { id: "application-1", state: "applied" } }), {
        status: 201,
        headers: { "content-type": "application/json" }
      })
    );

    await expect(
      submitPublicApplication("pod-1", ["A pull request", "For focused accountability"], fetcher)
    ).resolves.toMatchObject({ id: "application-1", state: "applied" });
    expect(fetcher).toHaveBeenCalledWith("/api/pods/pod-1/applications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answers: ["A pull request", "For focused accountability"] })
    });
  });

  it("surfaces the server rejection instead of inventing a local state", async () => {
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ error: "Application already exists" }), {
        status: 409,
        headers: { "content-type": "application/json" }
      })
    );

    await expect(submitPublicApplication("pod-1", ["Already applied"], fetcher)).rejects.toThrow(
      "Application already exists"
    );
  });
});
