"use client";

import type { TemplateId } from "@pods/domain";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deletePodDraft } from "../lib/wizard-client";
import { adaptiveThemeForTemplate, mediaForTemplate } from "../lib/template-presentation";

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
    <div className="my-pods-list">
      <AnimatePresence initial={false}>
        {items.filter((item) => !removedIds.includes(item.id)).map((item, visualIndex) => {
          const isDraft = item.state === "draft";
          const isConfirming = confirmingId === item.id;
          return (
            <motion.article
              className={`my-pod-row adaptive-my-pod-row theme-${adaptiveThemeForTemplate(item.templateId)}`}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -8 }}
              key={item.id}
              layout
              transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link className="my-pod-main" href={item.href}>
                <span className="my-pod-thumbnail"><Image alt="" fill sizes="64px" src={mediaForTemplate(item.templateId, visualIndex).hero} /></span>
                <span className="my-pod-copy">
                  <strong>{item.name}</strong>
                  <small>{item.templateName}</small>
                </span>
              </Link>
              {isDraft ? (
                <div className="draft-row-actions">
                  <Link className="resume-draft-action" href={item.href}>Resume</Link>
                  <button
                    aria-expanded={isConfirming}
                    className="delete-draft-action"
                    onClick={() => {
                      setError("");
                      setConfirmingId(item.id);
                    }}
                    type="button"
                  >
                    Delete draft
                  </button>
                </div>
              ) : (
                <div className="published-pod-status">
                  <strong>{item.statusLabel ?? "Enrollment open"}</strong>
                  <small>{item.statusDetail ?? "Rules frozen"}</small>
                </div>
              )}
              <AnimatePresence initial={false}>
                {isConfirming ? (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    aria-label={`Delete ${item.name}`}
                    className="draft-delete-confirmation"
                    initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
                    role="group"
                  >
                    <div>
                      <strong>Delete this draft?</strong>
                      <p>It has not been published and no funds are involved.</p>
                    </div>
                    <div className="draft-delete-buttons">
                      <button
                        className="keep-draft-action"
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
                        className="confirm-delete-action"
                        disabled={deletingId === item.id}
                        onClick={() => removeDraft(item)}
                        type="button"
                      >
                        {deletingId === item.id ? "Deleting" : "Delete permanently"}
                      </button>
                    </div>
                    {error ? <p className="draft-delete-error" role="alert">{error}</p> : null}
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
