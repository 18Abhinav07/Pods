import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh })
}));

import { OpsConnectForm } from "../src/components/ops-connect-form";
import { PayoutRetryControls } from "../src/components/payout-retry-controls";
import { PublicModerationControls } from "../src/components/public-moderation-controls";
import { ReportProfileForm } from "../src/components/report-profile-form";

function deferredResponse() {
  let resolve!: (value: Response) => void;
  const promise = new Promise<Response>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

describe("operations mutation controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("locks ops access submission until the active request finishes", async () => {
    const pending = deferredResponse();
    const request = vi.fn(() => pending.promise);
    vi.stubGlobal("fetch", request);
    const { container } = render(<OpsConnectForm returnTo="/ops/transfers" />);

    fireEvent.change(screen.getByLabelText("Pods operations access token"), {
      target: { value: "internal-token" }
    });
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);
    fireEvent.submit(form!);

    expect(request).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Checking access" })).toBeDisabled();

    pending.resolve(new Response(JSON.stringify({ returnTo: "/ops/transfers" }), {
      status: 200
    }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/ops/transfers"));
  });

  it("protects public safety actions from duplicate submission", async () => {
    const pending = deferredResponse();
    const request = vi.fn(() => pending.promise);
    vi.stubGlobal("fetch", request);
    const { container } = render(
      <PublicModerationControls reportId="report-1" />
    );

    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);
    fireEvent.submit(form!);

    expect(request).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Applying action" })).toBeDisabled();

    pending.resolve(new Response("{}", { status: 200 }));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });

  it("protects payout recovery from duplicate submission", async () => {
    const pending = deferredResponse();
    const request = vi.fn(() => pending.promise);
    vi.stubGlobal("fetch", request);
    const { container } = render(<PayoutRetryControls legId="leg-1" />);

    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);
    fireEvent.submit(form!);

    expect(request).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Checking chain" })).toBeDisabled();

    pending.resolve(new Response("{}", { status: 200 }));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });

  it("recovers the private report form after a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<ReportProfileForm handle="ari" />);

    fireEvent.change(screen.getByLabelText("What happened?"), {
      target: { value: "This public profile needs a safety review." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Send private report" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Report could not be sent. Check the details and try again."
    );
    expect(screen.getByRole("button", { name: "Send private report" })).toBeEnabled();
  });
});
