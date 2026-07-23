"use client";

import { normalizeInvitationToken, templateContracts, type TemplateId } from "@pods/domain";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { previewPrivateInvitation } from "../lib/invitation-client";
import { InvitationAcceptance } from "./invitation-acceptance";
import { TemplateSymbol } from "./template-symbol";

type PrivatePreview = {
  podId: string;
  templateId: TemplateId;
  activityName: string;
  purpose: string;
  startDate: string;
  endDate: string;
  occurrenceCount: number;
  totalLuna: number;
  minParticipants: number;
  maxParticipants: number;
};

function nim(luna: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 5 }).format(luna / 100_000);
}

export function InvitationLanding({ connected }: { connected: boolean }) {
  const router = useRouter();
  const [invitation, setInvitation] = useState<{
    token: string;
    preview: PrivatePreview;
  } | null>(null);

  useEffect(() => {
    const normalized = normalizeInvitationToken(window.location.hash.slice(1));
    if (!normalized) {
      router.replace("/invite/unavailable");
      return;
    }
    previewPrivateInvitation(normalized)
      .then((value) => setInvitation({ token: normalized, preview: value as PrivatePreview }))
      .catch(() => router.replace("/invite/unavailable"));
  }, [router]);

  if (!invitation) {
    return (
      <main className="app-shell private-invite-shell">
        <header className="app-topbar"><Link className="wordmark" href="/"><span className="pod-mark" aria-hidden="true" />pods</Link><span className="phase-pill">Private invitation</span></header>
        <section className="invite-loading" role="status"><span /><strong>Checking invitation</strong><p>Validating this single-use private entry.</p></section>
      </main>
    );
  }

  const { preview, token } = invitation;
  const template = templateContracts.find((item) => item.id === preview.templateId);
  return (
    <main className="app-shell private-invite-shell">
      <header className="app-topbar entrance entrance-topbar"><Link className="wordmark" href="/"><span className="pod-mark" aria-hidden="true" />pods</Link><span className="phase-pill">Private invitation</span></header>
      <section className="public-preview-hero entrance entrance-hero"><TemplateSymbol templateId={preview.templateId} /><p className="eyebrow">{template?.name}</p><h1>{preview.activityName}</h1><p>{preview.purpose}</p></section>
      <section className="public-preview-ledger entrance entrance-status">
        <div><span>Schedule</span><strong>{preview.occurrenceCount} occurrences</strong><small>{preview.startDate} to {preview.endDate}</small></div>
        <div><span>Upfront commitment</span><strong>{nim(preview.totalLuna)} NIM</strong><small>Required after acceptance</small></div>
        <div><span>Community</span><strong>{preview.minParticipants} to {preview.maxParticipants} people</strong><small>Hidden private activity</small></div>
        <div><span>Verification</span><strong>Creator review</strong><small>The Pod creator reviews member proofs. The creator does not fund this Pod or receive any member funds.</small></div>
      </section>
      <aside className="reservation-disclosure"><strong>Single-use private entry</strong><p>This link admits one wallet. Acceptance does not reserve a place until funding finality and roster lock.</p></aside>
      <InvitationAcceptance connected={connected} token={token} />
    </main>
  );
}
