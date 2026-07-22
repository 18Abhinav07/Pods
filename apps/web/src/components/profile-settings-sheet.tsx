"use client";

import type { ProfileInput } from "@pods/domain";
import {
  ArrowLeft,
  ArrowSquareOut,
  GearSix,
  PencilSimple,
  Wallet,
  X
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ProfileOnboardingForm } from "./profile-onboarding-form";
import { WalletSessionSwitcher } from "./wallet-session-switcher";

type SettingsView = "menu" | "edit" | "wallet";

export function ProfileSettingsSheet({
  profile,
  walletAddress
}: {
  profile: ProfileInput;
  walletAddress: string;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<SettingsView>("menu");
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLElement>(null);

  function close() {
    setOpen(false);
    setView("menu");
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
      if (event.shiftKey && document.activeElement === first) {
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

  return (
    <>
      <button
        aria-label="Open profile settings"
        className="profile-settings-trigger"
        onClick={() => setOpen(true)}
        ref={trigger}
        type="button"
      >
        <GearSix aria-hidden="true" size={22} weight="bold" />
      </button>

      {open ? (
        <div className="profile-settings-sheet" role="presentation">
          <button aria-label="Close profile settings" className="profile-settings-backdrop" onClick={close} type="button" />
          <section aria-label="Profile settings" aria-modal="true" className="profile-settings-dialog" ref={dialog} role="dialog" tabIndex={-1}>
            <header className="profile-settings-sheet-head">
              {view === "menu" ? <span /> : (
                <button aria-label="Back to profile settings" onClick={() => setView("menu")} type="button">
                  <ArrowLeft aria-hidden="true" size={21} weight="bold" />
                </button>
              )}
              <strong>{view === "edit" ? "Edit profile" : view === "wallet" ? "Wallet and session" : "Profile settings"}</strong>
              <button aria-label="Close profile settings" onClick={close} type="button">
                <X aria-hidden="true" size={21} weight="bold" />
              </button>
            </header>

            {view === "menu" ? (
              <nav className="profile-settings-menu" aria-label="Profile setting options">
                <button aria-label="Edit profile" onClick={() => setView("edit")} type="button">
                  <PencilSimple aria-hidden="true" size={22} weight="bold" />
                  <span><strong>Edit profile</strong><small>Photo, name, bio, and privacy</small></span>
                </button>
                {profile.visibility === "public" ? (
                  <Link href={`/u/${profile.handle}`} onClick={close}>
                    <ArrowSquareOut aria-hidden="true" size={22} weight="bold" />
                    <span><strong>View public profile</strong><small>See what the community sees</small></span>
                  </Link>
                ) : null}
                <button aria-label="Wallet and session" onClick={() => setView("wallet")} type="button">
                  <Wallet aria-hidden="true" size={22} weight="bold" />
                  <span><strong>Wallet and session</strong><small>Private connection controls</small></span>
                </button>
              </nav>
            ) : null}

            {view === "edit" ? (
              <div className="profile-settings-edit">
                <ProfileOnboardingForm initialProfile={profile} returnTo="/profile" />
              </div>
            ) : null}

            {view === "wallet" ? (
              <div className="profile-settings-wallet">
                <span>Connected Nimiq wallet</span>
                <code>{walletAddress}</code>
                <p>This address is only visible to you and the financial services that require it.</p>
                <WalletSessionSwitcher />
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
