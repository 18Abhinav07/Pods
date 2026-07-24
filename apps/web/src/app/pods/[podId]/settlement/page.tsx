import { notFound } from "next/navigation";

import { AppHeader } from "../../../../components/app-header";
import { SettlementFinalizeButton } from "../../../../components/settlement-finalize-button";
import { SettlementSummary } from "../../../../components/settlement-summary";
import { profileForSession } from "../../../../lib/profile-presentation";
import { podsRepository } from "../../../../lib/server-db";
import { requireSession } from "../../../../lib/session";

export default async function SettlementPage({
  params
}: {
  params: Promise<{ podId: string }>;
}) {
  const { podId } = await params;
  const session = await requireSession(`/pods/${podId}/settlement`);
  const [creator, participant, profile] = await Promise.all([
    podsRepository.getCreatorSettlement({
      podId,
      creatorUserId: session.userId
    }),
    podsRepository.getParticipantSettlement({
      podId,
      userId: session.userId
    }),
    profileForSession(session.userId)
  ]);
  const view = creator ?? participant;
  if (!view?.pod.contractData) notFound();
  let creatorCanFinalize = false;
  if (creator && !creator.settlement) {
    const now = await podsRepository.getEffectiveTime(new Date());
    creatorCanFinalize = (
      await podsRepository.listSettlementReadyPods(now)
    ).some((candidate) => candidate.id === podId);
  }

  const activity = view.pod.contractData.activity;
  return (
    <main className="app-shell settlement-shell">
      <AppHeader
        profile={profile}
        showPeopleSearch={false}
        title="Settlement"
      />
      <section className="settlement-hero entrance entrance-hero">
        <p className="eyebrow">
          {view.settlement?.state === "settled"
            ? "Treasury complete"
            : "Final review"}
        </p>
        <h1>{activity.name}</h1>
        <p>
          Frozen outcomes become one conserved Testnet NIM settlement. The
          creator and Pods receive none of the participant pool.
        </p>
      </section>

      {!view.settlement ? (
        <section className="settlement-pending entrance entrance-status">
          <span>All outcomes must be terminal</span>
          <h2>Settlement is ready when review closes.</h2>
          <p>
            Missing evidence becomes missed. Any submission still under review
            keeps the calculation locked.
          </p>
          {creatorCanFinalize ? <SettlementFinalizeButton podId={podId} /> : null}
        </section>
      ) : creator?.settlement ? (
        <SettlementSummary
          entitlementCount={creator.entitlements.length}
          mode="creator"
          occurrenceCount={creator.occurrences.length}
          settlement={creator.settlement}
        />
      ) : participant?.entitlement && participant.settlement ? (
        <SettlementSummary
          entitlement={participant.entitlement}
          mode="participant"
          outcomes={participant.outcomes}
          settlement={participant.settlement}
          transfer={participant.transfer}
        />
      ) : null}
    </main>
  );
}
