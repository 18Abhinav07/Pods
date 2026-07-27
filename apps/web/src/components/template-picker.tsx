"use client";

import { templateContracts, type TemplateId } from "@pods/domain";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createPodDraft } from "../lib/wizard-client";
import { mediaForTemplate } from "../lib/template-presentation";
import styles from "./creator-flow.module.css";

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
    <div className={styles.templateList}>
      {templateContracts.map((template, index) => (
        <motion.button
          className={styles.templateCard}
          data-pending={pending === template.id}
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
          <span className={styles.templateMedia}><Image alt="" fill sizes="64px" src={mediaForTemplate(template.id).hero} /></span>
          <span className={styles.templateCopy}>
            <strong>{template.name}</strong>
            <small>{template.summary}</small>
          </span>
          <i className={styles.templateIndicator} aria-hidden="true">
            {pending === template.id ? "…" : "→"}
          </i>
        </motion.button>
      ))}
      {error ? <div className={styles.error} role="alert">{error}</div> : null}
    </div>
  );
}
