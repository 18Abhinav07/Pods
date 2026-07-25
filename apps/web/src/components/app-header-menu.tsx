"use client";

import {
  Bell,
  Check,
  DotsThree,
  MagnifyingGlass,
  Plus,
  X
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type AppHeaderAction = {
  description: string;
  href: string;
  label: string;
  kind?: "create" | "done";
};

export function AppHeaderMenu({
  action,
  showPeopleSearch,
  unreadUpdates
}: {
  action?: AppHeaderAction;
  showPeopleSearch: boolean;
  unreadUpdates: number;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLElement>(null);

  function close() {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const triggerElement = trigger.current;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !dialog.current) return;
      const focusable = Array.from(dialog.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])"
      ));
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.current.focus();
        return;
      }
      const first = focusable[0]!;
      const last = focusable.at(-1)!;
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog.current)
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
  }, [open]);

  const ActionIcon = action?.kind === "done" ? Check : Plus;

  return (
    <>
      <button
        aria-expanded={open}
        aria-label="Open page actions"
        className="app-header-menu-trigger"
        onClick={() => setOpen(true)}
        ref={trigger}
        type="button"
      >
        <DotsThree aria-hidden="true" size={23} weight="bold" />
      </button>

      {open ? createPortal(
        <div className="app-header-menu-layer" role="presentation">
          <button
            aria-hidden="true"
            className="app-header-menu-backdrop"
            onClick={close}
            tabIndex={-1}
            type="button"
          />
          <section
            aria-label="Page actions"
            aria-modal="true"
            className="app-header-menu-sheet"
            ref={dialog}
            role="dialog"
            tabIndex={-1}
          >
            <header>
              <span>
                <small>Navigate</small>
                <strong>Quick actions</strong>
              </span>
              <button aria-label="Close page actions" onClick={close} type="button">
                <X aria-hidden="true" size={21} weight="bold" />
              </button>
            </header>
            <nav aria-label="Page action links">
              {action ? (
                <Link aria-label={action.label} href={action.href} onClick={close}>
                  <i aria-hidden="true">
                    <ActionIcon size={21} weight="bold" />
                  </i>
                  <span>
                    <strong>{action.label}</strong>
                    <small>{action.description}</small>
                  </span>
                </Link>
              ) : null}
              {showPeopleSearch ? (
                <Link aria-label="Search people" href="/people/search" onClick={close}>
                  <i aria-hidden="true">
                    <MagnifyingGlass size={21} weight="bold" />
                  </i>
                  <span>
                    <strong>Search people</strong>
                    <small>Find a profile by name or handle</small>
                  </span>
                </Link>
              ) : null}
              <Link aria-label="Open updates" href="/updates" onClick={close}>
                <i aria-hidden="true">
                  <Bell size={21} weight="bold" />
                </i>
                <span>
                  <strong>Updates</strong>
                  <small>
                    {unreadUpdates > 0
                      ? `${Math.min(unreadUpdates, 99)} unread`
                      : "Applications, reviews, and payouts"}
                  </small>
                </span>
                {unreadUpdates > 0 ? (
                  <b aria-label={`${Math.min(unreadUpdates, 99)} unread updates`}>
                    {Math.min(unreadUpdates, 99)}
                  </b>
                ) : null}
              </Link>
            </nav>
          </section>
        </div>,
        document.body
      ) : null}
    </>
  );
}
