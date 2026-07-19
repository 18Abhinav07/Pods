import { describe, expect, it, vi } from "vitest";

import {
  acceptPrivateInvitation,
  createPrivateInvitation,
  previewPrivateInvitation,
  revokePrivateInvitation
} from "../src/lib/invitation-client";
import { createInvitationToken, hashInvitationToken } from "../src/lib/invitations";

describe("invitation token security", () => {
  it("creates a 43-character opaque token and stores a one-way digest", () => {
    const token = createInvitationToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hashInvitationToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashInvitationToken(token)).not.toContain(token);
  });
});

describe("private invitation commands", () => {
  it("creates and revokes only through the owner-scoped routes", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ invitation: { id: "invite-1" }, token: "x".repeat(43) }), { status: 201 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await createPrivateInvitation("pod-1", fetcher);
    await revokePrivateInvitation("pod-1", "invite-1", fetcher);
    expect(fetcher).toHaveBeenNthCalledWith(1, "/api/pods/pod-1/invitations", { method: "POST" });
    expect(fetcher).toHaveBeenNthCalledWith(2, "/api/pods/pod-1/invitations/invite-1", { method: "DELETE" });
  });

  it("accepts only with explicit frozen-contract consent", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ membership: { state: "accepted_unfunded", podId: "pod-1" } }), { status: 200 }));

    await acceptPrivateInvitation("x".repeat(43), fetcher);
    expect(fetcher).toHaveBeenCalledWith("/api/invitations/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "x".repeat(43), acceptedFrozenContract: true })
    });
  });

  it("loads the private preview without putting the bearer in the request URL", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ preview: { podId: "pod-1" } }), { status: 200 }));

    await previewPrivateInvitation("x".repeat(43), fetcher);
    expect(fetcher).toHaveBeenCalledWith("/api/invitations/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "x".repeat(43) })
    });
  });
});
