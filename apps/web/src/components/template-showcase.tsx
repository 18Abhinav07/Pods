"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { templates, type TemplateId } from "./template-data";
import { TemplateSymbol } from "./template-symbol";

const selectionSpring = {
  type: "spring",
  stiffness: 320,
  damping: 30,
  mass: 0.72
} as const;

export function TemplateShowcase() {
  const [selectedId, setSelectedId] = useState<TemplateId>(templates[0].id);
  const shouldReduceMotion = useReducedMotion();
  const selected = templates.find((template) => template.id === selectedId) ?? templates[0];
  const selectionTransition = shouldReduceMotion
    ? { duration: 0 }
    : selectionSpring;

  return (
    <div className="template-showcase">
      <div className="template-list" aria-label="Activity templates">
        {templates.map((template) => {
          const isSelected = template.id === selectedId;

          return (
            <motion.button
              aria-pressed={isSelected}
              className="template-row template-selector"
              key={template.id}
              onClick={() => setSelectedId(template.id)}
              transition={selectionTransition}
              type="button"
            >
              {isSelected ? (
                <motion.span
                  aria-hidden="true"
                  className="template-selection"
                  layoutId="template-selection"
                  transition={selectionTransition}
                />
              ) : null}
              <TemplateSymbol templateId={template.id} />
              <span className="template-copy">
                <strong>{template.name}</strong>
                <small>{template.detail}</small>
              </span>
              <span className="template-state">
                {isSelected ? "Selected" : "Specified"}
              </span>
            </motion.button>
          );
        })}
      </div>

      <section
        aria-label="Selected evidence contract"
        aria-live="polite"
        className="evidence-contract"
      >
        <span>Evidence contract</span>
        <AnimatePresence initial={false} mode="wait">
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            key={selected.id}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.22,
              ease: [0.16, 1, 0.3, 1]
            }}
          >
            <strong>{selected.name}</strong>
            {selected.evidence}
          </motion.p>
        </AnimatePresence>
      </section>
    </div>
  );
}
