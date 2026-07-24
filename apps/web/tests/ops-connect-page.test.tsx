import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/components/ops-connect-form", () => ({
  OpsConnectForm: ({ returnTo }: { returnTo: string }) => (
    <span data-testid="return-target">{returnTo}</span>
  )
}));

import OpsConnectPage from "../src/app/ops/connect/page";

describe("ops connect page", () => {
  it("describes the combined internal operations authority", async () => {
    render(await OpsConnectPage({
      searchParams: Promise.resolve({})
    }));

    expect(screen.getByRole("heading", { name: "Internal controls." })).toBeVisible();
    expect(screen.getByText(
      "Review public safety reports and recover Testnet payouts without changing frozen Pod outcomes."
    )).toBeVisible();
  });

  it("rejects removed and nonexistent ops return targets", async () => {
    const { rerender } = render(await OpsConnectPage({
      searchParams: Promise.resolve({ returnTo: "/ops/reviews" })
    }));
    expect(screen.getByTestId("return-target")).toHaveTextContent("/ops/public-safety");

    rerender(await OpsConnectPage({
      searchParams: Promise.resolve({ returnTo: "/ops/public-safety" })
    }));
    expect(screen.getByTestId("return-target")).toHaveTextContent("/ops/public-safety");

    rerender(await OpsConnectPage({
      searchParams: Promise.resolve({ returnTo: "/ops/transfers" })
    }));
    expect(screen.getByTestId("return-target")).toHaveTextContent("/ops/transfers");
  });
});
