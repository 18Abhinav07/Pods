import { beforeEach, describe, expect, it, vi } from "vitest";

const hasOpsSession = vi.hoisted(() => vi.fn());
const moderatePublicReport = vi.hoisted(() => vi.fn());
const reportId = "430296c7-9554-43e6-9b43-bfd063391028";

vi.mock("../src/lib/ops-session", () => ({ hasOpsSession }));
vi.mock("../src/lib/server-db", () => ({
  podsRepository: { moderatePublicReport }
}));

import { POST } from "../src/app/api/ops/public-safety/reports/[reportId]/action/route";

describe("public safety operations route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("PODS_MODERATION_ENABLED", "true");
    vi.stubEnv("PODS_OPS_REVIEWER_ID", "pods-safety");
    hasOpsSession.mockResolvedValue(true);
    moderatePublicReport.mockResolvedValue({
      id: "action-1",
      action: "suppress_content"
    });
  });

  it("records an authenticated moderation action with server authority", async () => {
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          action: "suppress_content",
          reason: "Temporarily hidden for a public safety review."
        })
      }),
      { params: Promise.resolve({ reportId }) }
    );

    expect(response.status).toBe(200);
    expect(moderatePublicReport).toHaveBeenCalledWith(expect.objectContaining({
      reportId,
      actor: "pods-safety",
      action: "suppress_content"
    }));
  });

  it("rejects an unauthenticated operations mutation", async () => {
    hasOpsSession.mockResolvedValue(false);
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          action: "dismiss_report",
          reason: "No public safety violation was found."
        })
      }),
      { params: Promise.resolve({ reportId }) }
    );

    expect(response.status).toBe(401);
    expect(moderatePublicReport).not.toHaveBeenCalled();
  });
});
