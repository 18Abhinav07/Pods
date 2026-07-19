"use client";

import { templateContracts, type TemplateId } from "@pods/domain";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createPodDraft } from "../lib/wizard-client";

export function TemplatePicker() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [pending, setPending] = useState<TemplateId | null>(null);
  const [error, setError] = useState("");

  async function choose(templateId: TemplateId) {
    setError("");
    setPending(templateId);
    try {
      const draft = await createPodDraft(templateId);
      router.push(`/pods/create/activity?draft=${encodeURIComponent(draft.id)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pod draft could not be created");
      setPending(null);
    }
  }

  return (
    <div className="creation-template-list">
      {templateContracts.map((template, index) => (
        <motion.button
          className="creation-template"
          disabled={pending !== null}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.42,
            delay: shouldReduceMotion ? 0 : index * 0.055,
            ease: [0.16, 1, 0.3, 1]
          }}
          key={template.id}
          onClick={() => choose(template.id)}
          type="button"
        >
          <span className={`template-icon template-${index + 1}`} aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span>
            <strong>{template.name}</strong>
            <small>{template.summary}</small>
            <em>{template.evidence}</em>
          </span>
          <b>{pending === template.id ? "Saving" : "Choose"}</b>
        </motion.button>
      ))}
      {error ? <div className="inline-error" role="alert"><span>{error}</span></div> : null}
    </div>
  );
}
