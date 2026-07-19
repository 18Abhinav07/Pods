import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { TemplateShowcase } from "../src/components/template-showcase";

describe("TemplateShowcase", () => {
  it("starts with the Move evidence contract selected", () => {
    render(<TemplateShowcase />);

    expect(screen.getByRole("button", { name: /Move/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(
      screen.getByRole("region", { name: "Selected evidence contract" })
    ).toHaveTextContent("measurable activity minimum");
  });

  it("moves selection and evidence detail to Build", async () => {
    const user = userEvent.setup();
    render(<TemplateShowcase />);

    await user.click(screen.getByRole("button", { name: /Build/i }));

    expect(screen.getByRole("button", { name: /Build/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await waitFor(() => {
      expect(
        screen.getByRole("region", { name: "Selected evidence contract" })
      ).toHaveTextContent("GitHub or live artifact link");
    });
  });
});
