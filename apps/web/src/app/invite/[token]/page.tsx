import { normalizeInvitationToken, templateContracts } from "@pods/domain";
import Link from "next/link";
import { notFound } from "next/navigation";

import { InvitationAcceptance } from "../../../components/invitation-acceptance";
import { TemplateSymbol } from "../../../components/template-symbol";
import { hashInvitationToken } from "../../../lib/invitations";
import { podsRepository } from "../../../lib/server-db";
import { getCurrentSession } from "../../../lib/session";

function nim(luna: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 5 }).format(luna / 100_000);
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token: tokenValue } = await params;
  const token = normalizeInvitationToken(tokenValue);
  if (!token) notFound();
  const preview = await podsRepository.getInvitationPreviewByTokenHash(hashInvitationToken(token), new Date());
  if (!preview) notFound();
  const session = await getCurrentSession();
  const template = templateContracts.find((item) => item.id === preview.templateId);

  return (
    <main className="app-shell private-invite-shell">
      <header className="app-topbar entrance entrance-topbar"><Link className="wordmark" href="/"><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link><span className="phase-pill">Private invitation</span></header>
      <section className="public-preview-hero entrance entrance-hero"><TemplateSymbol templateId={preview.templateId} /><p className="eyebrow">{template?.name}</p><h1>{preview.activityName}</h1><p>{preview.purpose}</p></section>
      <section className="public-preview-ledger entrance entrance-status">
        <div><span>Schedule</span><strong>{preview.occurrenceCount} occurrences</strong><small>{preview.startDate} to {preview.endDate}</small></div>
        <div><span>Upfront commitment</span><strong>{nim(preview.totalLuna)} NIM</strong><small>Funding begins in Phase 3</small></div>
        <div><span>Community</span><strong>{preview.minParticipants} to {preview.maxParticipants} people</strong><small>Hidden private activity</small></div>
        <div><span>Verification</span><strong>Pods team review</strong><small>Not peer-voted or creator-controlled</small></div>
      </section>
      <aside className="reservation-disclosure"><strong>Single-use private entry</strong><p>This link admits one wallet. Acceptance does not reserve a place until funding finality and roster lock.</p></aside>
      <InvitationAcceptance connected={Boolean(session)} token={token} />
    </main>
  );
}
