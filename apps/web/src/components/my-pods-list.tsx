"use client";

import type { TemplateId } from "@pods/domain";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deletePodDraft } from "../lib/wizard-client";
import { mediaForTemplate } from "../lib/template-presentation";
import styles from "./home-flow.module.css";

export type MyPodListItem = {
  id: string;
  href: string;
  name: string;
  state: string;
  templateId: TemplateId;
  templateName: string;
  statusLabel?: string;
  statusDetail?: string;
};

export function MyPodsList({ items }: { items: MyPodListItem[] }) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  async function removeDraft(item: MyPodListItem) {
    setError("");
    setDeletingId(item.id);
    try {
      await deletePodDraft(item.id);
      setRemovedIds((current) => [...current, item.id]);
      setConfirmingId(null);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pod draft could not be deleted");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className={styles.podList}>
      <AnimatePresence initial={false}>
        {items.filter((item) => !removedIds.includes(item.id)).map((item, visualIndex) => {
          const isDraft = item.state === "draft";
          const isConfirming = confirmingId === item.id;
          return (
            <motion.article
              className={styles.podCard}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -8 }}
              key={item.id}
              layout
              transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link className={styles.podLink} href={item.href}>
                <span className={styles.podThumb}><Image alt="" fill loading={visualIndex === 0 ? "eager" : "lazy"} sizes="68px" src={mediaForTemplate(item.templateId, visualIndex).hero} /></span>
                <span className={styles.podCopy}>
                  <small>{item.templateName}</small>
                  <strong>{item.name}</strong>
                  <span className={styles.podStatus}>
                    <strong>{isDraft ? "Draft" : item.statusLabel ?? "Enrollment open"}</strong>
                    <span>{isDraft ? "Resume creation. No financial exposure." : item.statusDetail ?? "Rules frozen"}</span>
                  </span>
                </span>
                <i className={styles.podArrow} aria-hidden="true">→</i>
              </Link>
              {isDraft ? (
                <div className={styles.draftActions}>
                  <button
                    aria-expanded={isConfirming}
                    className={styles.deleteDraft}
                    onClick={() => {
                      setError("");
                      setConfirmingId(item.id);
                    }}
                    type="button"
                  >
                    Delete draft
                  </button>
                </div>
              ) : null}
              <AnimatePresence initial={false}>
                {isConfirming ? (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    aria-label={`Delete ${item.name}`}
                    className={styles.deleteConfirmation}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
                    role="group"
                  >
                    <div>
                      <strong>Delete this draft?</strong>
                      <p>It has not been published and no funds are involved.</p>
                    </div>
                    <div className={styles.deleteButtons}>
                      <button
                        className={styles.keepDraft}
                        disabled={deletingId === item.id}
                        onClick={() => {
                          setError("");
                          setConfirmingId(null);
                        }}
                        type="button"
                      >
                        Keep draft
                      </button>
                      <button
                        className={styles.confirmDelete}
                        disabled={deletingId === item.id}
                        onClick={() => removeDraft(item)}
                        type="button"
                      >
                        {deletingId === item.id ? "Deleting" : "Delete permanently"}
                      </button>
                    </div>
                    {error ? <p className={styles.deleteError} role="alert">{error}</p> : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.article>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
