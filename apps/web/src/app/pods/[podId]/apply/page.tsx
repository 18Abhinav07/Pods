import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ApplicationForm } from "../../../../components/application-form";
import { podsRepository } from "../../../../lib/server-db";
import { requireSession } from "../../../../lib/session";

export default async function ApplyPage({ params }: { params: Promise<{ podId: string }> }) {
  const { podId } = await params;
  const pod = await podsRepository.getPublicPod(podId, new Date());
  if (!pod?.contractData || pod.contractData.community.visibility !== "public") notFound();
  const session = await requireSession(`/pods/${podId}/apply`);
  if (pod.creatorUserId === session.userId) notFound();
  const existing = await podsRepository.getMembershipForUser(session.userId, podId);
  if (existing) redirect(`/applications?pod=${podId}`);
  const contract = pod.contractData;
  if (contract.community.visibility !== "public") notFound();

  return (
    <main className="app-shell application-shell">
      <header className="app-topbar entrance entrance-topbar">
        <Link className="wordmark" href={`/pods/${podId}`}><span className="pod-mark" aria-hidden="true" />pods</Link>
        <span className="phase-pill">Application</span>
      </header>
      <section className="today-hero entrance entrance-hero">
        <p className="eyebrow">Apply to {contract.activity.name}</p>
        <h1>Show the creator how you will participate.</h1>
        <p className="screen-copy">Your answers are frozen with this application and visible to the Pod creator.</p>
      </section>
      <aside className="reservation-disclosure">
        <strong>No place is reserved yet</strong>
        <p>Applying does not reserve a place. A place is secured only after acceptance, funding finality, and roster lock.</p>
      </aside>
      <ApplicationForm
        podId={podId}
        questions={contract.community.applicationQuestions}
        visitorConsent={
          contract.version === 2 &&
          contract.community.roomAudience === "public_read_only" &&
          pod.contractHash
            ? { contractHash: pod.contractHash }
            : null
        }
      />
    </main>
  );
}
