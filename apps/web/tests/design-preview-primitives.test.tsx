import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  ActionDock,
  ChoiceCard,
  ChoiceIndicator,
  ConsentPanel,
  FinancialReceipt,
  NimMedallion,
  OutcomeStrip,
  RequestCard,
  SwitchRow,
  TerminalOutcome,
  TransferTracker,
  UploadAvatarTile
} from "../src/components/design-preview/primitives";

describe("design preview primitives", () => {
  it("renders an accessible selected choice card and indicator", () => {
    const onSelect = vi.fn();
    render(
      <>
        <ChoiceCard
          description="Daily output and public artifacts"
          name="template"
          onSelect={onSelect}
          selected
          title="Build and Ship"
          value="build"
        />
        <ChoiceIndicator selected={false} />
      </>
    );

    const choice = screen.getByRole("radio", { name: /Build and Ship/ });
    expect(choice).toBeChecked();
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByTestId("choice-indicator-unselected")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  });

  it("uses native keyboard radio semantics and an explicit no-media layout", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <ChoiceCard
        description="Focused sessions and learning outputs"
        name="template"
        onSelect={onSelect}
        selected={false}
        title="Study and Focus"
        value="study"
      />
    );

    const choice = screen.getByRole("radio", { name: /Study and Focus/ });
    expect(choice.closest("label")).toHaveAttribute("data-layout", "without-media");

    choice.focus();
    await user.keyboard(" ");
    expect(onSelect).toHaveBeenCalledWith("study");
  });

  it("uses a distinct media layout and prevents disabled selection", () => {
    const onSelect = vi.fn();
    render(
      <ChoiceCard
        description="Movement, distance, or attendance"
        disabled
        media={<span data-testid="fitness-media">Run</span>}
        name="template"
        onSelect={onSelect}
        selected={false}
        title="Fitness and Movement"
        value="fitness"
      />
    );

    const choice = screen.getByRole("radio", {
      name: /Fitness and Movement/
    });
    expect(choice).toBeDisabled();
    expect(choice.closest("label")).toHaveAttribute("data-layout", "with-media");
    expect(choice.closest("label")).toHaveAttribute("data-disabled", "true");

    fireEvent.click(choice);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("uses a semantic switch with visible supporting copy", () => {
    const onCheckedChange = vi.fn();
    render(
      <SwitchRow
        checked
        description="Anyone with the link can watch public room activity."
        label="Allow read-only visitors"
        onCheckedChange={onCheckedChange}
      />
    );

    const control = screen.getByRole("switch", {
      name: "Allow read-only visitors"
    });
    expect(control).toBeChecked();
    fireEvent.click(control);
    expect(onCheckedChange).toHaveBeenCalledWith(false);
    expect(
      screen.getByText("Anyone with the link can watch public room activity.")
    ).toBeVisible();
  });

  it("keeps screen actions grouped and ordered in an action dock", () => {
    render(
      <ActionDock
        primary={{ label: "Continue", onClick: vi.fn() }}
        secondary={{ label: "Save and exit", onClick: vi.fn() }}
      />
    );

    const dock = screen.getByRole("region", { name: "Screen actions" });
    expect(within(dock).getAllByRole("button").map((button) => button.textContent)).toEqual([
      "Continue",
      "Save and exit"
    ]);
  });

  it("uses explicit request decisions instead of an overflow menu", () => {
    render(
      <RequestCard
        context="1 shared Pod"
        introduction="I would like to compare build notes."
        name="Noah Mercer"
        onAccept={vi.fn()}
        onDecline={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Accept Noah Mercer" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Decline Noah Mercer" })).toBeVisible();
    expect(screen.queryByRole("button", { name: /more|options/i })).not.toBeInTheDocument();
  });

  it("renders the official Nimiq signet and a legible commitment receipt", () => {
    render(
      <>
        <NimMedallion />
        <FinancialReceipt
          amountPerOccurrence={0.1}
          currency="NIM"
          occurrenceCount={3}
        />
      </>
    );

    expect(screen.getByRole("img", { name: "Nimiq" })).toHaveAttribute(
      "src",
      "/media/nimiq-signet.svg"
    );
    expect(screen.getByText("3 occurrences x 0.1 NIM")).toBeVisible();
    const receipt = screen.getByText("Maximum upfront").closest("dl");
    expect(receipt).not.toBeNull();
    expect(within(receipt!).getByText("0.3 NIM")).toBeVisible();
    expect(
      within(receipt!).queryByText("Maximum upfront: 0.3 NIM")
    ).not.toBeInTheDocument();
  });

  it("communicates transfer progress and outcome without relying on color", () => {
    render(
      <>
        <TransferTracker
          current="confirming"
          steps={[
            { id: "queued", label: "Queued" },
            { id: "submitted", label: "Submitted" },
            { id: "confirming", label: "Confirming" },
            { id: "confirmed", label: "Confirmed" }
          ]}
        />
        <OutcomeStrip label="Creator reviewing" tone="pending" />
      </>
    );

    expect(screen.getByRole("list", { name: "Transfer progress" })).toBeVisible();
    expect(screen.getByText("Confirming")).toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("status")).toHaveTextContent("Creator reviewing");
  });

  it("keeps consent and terminal outcomes semantic and actionable", () => {
    const onConsentChange = vi.fn();
    render(
      <>
        <ConsentPanel
          checked={false}
          description="Publishing freezes the schedule and financial terms."
          label="I accept the frozen contract"
          onCheckedChange={onConsentChange}
        />
        <TerminalOutcome
          action={{ label: "Open Pod archive", onClick: vi.fn() }}
          amount="0.4 NIM"
          heading="Payout confirmed"
          message="The transfer is finalized on Nimiq Testnet."
          tone="success"
        />
      </>
    );

    const checkbox = screen.getByRole("checkbox", {
      name: "I accept the frozen contract"
    });
    fireEvent.click(checkbox);
    expect(onConsentChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("status")).toHaveTextContent("Payout confirmed");
    expect(screen.getByRole("button", { name: "Open Pod archive" })).toBeVisible();
  });

  it("uses a destructive icon for a destructive terminal outcome", () => {
    render(
      <TerminalOutcome
        heading="Payout needs attention"
        message="Operations must reconcile this transfer."
        tone="danger"
      />
    );

    expect(screen.getByTestId("terminal-icon-danger")).toBeVisible();
    expect(screen.queryByTestId("terminal-icon-success")).not.toBeInTheDocument();
  });

  it("offers photo upload as a real button with clear formats", () => {
    render(<UploadAvatarTile onSelect={vi.fn()} />);

    const upload = screen.getByRole("button", { name: "Upload your photo" });
    expect(upload).toBeVisible();
    expect(screen.getByText("JPG, PNG, or WebP up to 5 MB")).toBeVisible();
  });
});
