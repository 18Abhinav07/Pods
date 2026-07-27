"use client";

import {
  Bell,
  CrownSimple,
  DotsThree,
  FileText,
  Lightning,
  ShareNetwork,
  UsersThree,
  X
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import styles from "./pod-room.module.css";

export function PodRoomHeader({
  isCreator,
  memberCount,
  name,
  podId,
  thumbnail
}: {
  isCreator: boolean;
  memberCount: number;
  name: string;
  podId: string;
  thumbnail: string;
}) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [shareState, setShareState] = useState("");
  const toolsTrigger = useRef<HTMLButtonElement>(null);
  const toolsDialog = useRef<HTMLElement>(null);

  function closeTools() {
    setToolsOpen(false);
  }

  useEffect(() => {
    if (!toolsOpen) return;
    const previousOverflow = document.body.style.overflow;
    const triggerElement = toolsTrigger.current;
    document.body.style.overflow = "hidden";
    toolsDialog.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeTools();
        return;
      }
      if (event.key !== "Tab" || !toolsDialog.current) return;
      const focusable = Array.from(toolsDialog.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])"
      ));
      if (focusable.length === 0) {
        event.preventDefault();
        toolsDialog.current.focus();
        return;
      }
      const first = focusable[0]!;
      const last = focusable.at(-1)!;
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === toolsDialog.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerElement?.focus();
    };
  }, [toolsOpen]);

  async function sharePod() {
    const url = typeof window === "undefined" ? `/pods/${podId}` : `${window.location.origin}/pods/${podId}`;
    if (typeof navigator.share === "function") {
      await navigator.share({ title: name, url });
      setShareState("Shared");
      return;
    }
    await navigator.clipboard?.writeText(url);
    setShareState("Link copied");
  }

  return (
    <>
      <header className={styles.header}>
        <span className={styles.identity}>
          <span className={styles.thumbnail}><Image alt="" fill sizes="42px" src={thumbnail} /></span>
          <span>
            <h1>{name}</h1>
            <small className={styles.meta}>
              <span>{memberCount} {memberCount === 1 ? "member" : "members"}</span>
            </small>
          </span>
        </span>
        <span className={styles.utilities}>
          <button className={styles.iconButton} aria-expanded={toolsOpen} aria-label="Open Pod tools" onClick={() => setToolsOpen(true)} ref={toolsTrigger} type="button">
            <DotsThree aria-hidden="true" size={23} weight="bold" />
          </button>
        </span>
      </header>
      {toolsOpen ? createPortal(
        <div className={styles.layer}>
          <button aria-hidden="true" className={styles.backdrop} onClick={closeTools} tabIndex={-1} type="button" />
          <section aria-label="Pod tools" aria-modal="true" className={styles.sheet} ref={toolsDialog} role="dialog" tabIndex={-1}>
            <header className={styles.sheetHeader}><span><small>Pod tools</small><strong>{name}</strong></span><button aria-label="Close Pod tools" onClick={closeTools} type="button"><X aria-hidden="true" size={21} weight="bold" /></button></header>
            <nav className={styles.sheetNav}>
              <Link aria-label="Proofs" href={`/pods/${podId}/activity`} onClick={closeTools}>
                <i aria-hidden="true"><Lightning size={20} weight="bold" /></i>
                <span><strong>Proofs</strong><small>Browse activity and submissions</small></span>
              </Link>
              <Link aria-label="Members" href={`/pods/${podId}/members`} onClick={closeTools}>
                <i aria-hidden="true"><UsersThree size={20} weight="bold" /></i>
                <span><strong>Members</strong><small>See who is building with you</small></span>
              </Link>
              <Link aria-label="Contract" href={`/pods/${podId}/rules`} onClick={closeTools}>
                <i aria-hidden="true"><FileText size={20} weight="bold" /></i>
                <span><strong>Contract</strong><small>Review the frozen Pod rules</small></span>
              </Link>
              {isCreator ? (
                <Link aria-label="Creator controls" href={`/pods/${podId}/admin`} onClick={closeTools}>
                  <i aria-hidden="true"><CrownSimple size={20} weight="bold" /></i>
                  <span><strong>Creator controls</strong><small>Applications, reviews, and room settings</small></span>
                </Link>
              ) : null}
              <Link aria-label="Open updates" href="/updates" onClick={closeTools}>
                <i aria-hidden="true"><Bell size={20} weight="bold" /></i>
                <span><strong>Updates</strong><small>Review decisions and payout activity</small></span>
              </Link>
            </nav>
            <button className={styles.sheetShare} onClick={() => void sharePod()} type="button"><ShareNetwork aria-hidden="true" size={20} weight="bold" /><span>{shareState || "Share Pod"}</span></button>
          </section>
        </div>,
        document.body
      ) : null}
    </>
  );
}
