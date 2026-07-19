import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

afterEach(cleanup);

function MotionSpike({ reducedMotion }: { reducedMotion: "always" | "never" }) {
  const [visible, setVisible] = useState(true);

  return (
    <MotionConfig reducedMotion={reducedMotion}>
      <motion.button
        aria-expanded={visible}
        layout
        onClick={() => setVisible((current) => !current)}
      >
        Toggle
      </motion.button>
      <AnimatePresence>
        {visible ? (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            Motion ready
          </motion.p>
        ) : null}
      </AnimatePresence>
    </MotionConfig>
  );
}

describe.each(["never", "always"] as const)("Motion React 19 spike: %s", (reducedMotion) => {
  it("renders and updates an AnimatePresence tree", () => {
    render(<MotionSpike reducedMotion={reducedMotion} />);
    expect(screen.getByText("Motion ready")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
    expect(screen.getByRole("button", { name: "Toggle" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });
});
