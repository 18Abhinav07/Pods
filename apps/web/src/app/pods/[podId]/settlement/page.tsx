import { notFound } from "next/navigation";
import { Clock, ShieldCheck } from "@phosphor-icons/react/dist/ssr";

import { AppHeader } from "../../../../components/app-header";
import { SettlementFinalizeButton } from "../../../../components/settlement-finalize-button";
import { SettlementSummary } from "../../../../components/settlement-summary";
import styles from "../../../../components/settlement-flow.module.css";
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
    profileForSession(session)
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
  const isCreator = Boolean(creator);
  const pendingEyebrow = creatorCanFinalize
    ? "Ready to calculate"
    : "Final review";
  const pendingTitle = creatorCanFinalize
    ? "All occurrence decisions are final."
    : "Settlement is ready when review closes.";
  return (
    <main className={`${styles.page} app-shell`}>
      <AppHeader
        profile={profile}
        showPeopleSearch={false}
        title="Settlement"
      />
      <div className={styles.content}>
        <header className={styles.routeIntro}>
          <p>{isCreator ? "Creator settlement" : "Your settlement"}</p>
          <h1>{activity.name}</h1>
          <span>
            Final outcomes become one conserved Testnet NIM record. The creator
            and Pods never receive participant funds.
          </span>
        </header>

        {!view.settlement ? (
          <section className={styles.pending}>
            <div className={styles.pendingSignal}>
              {creatorCanFinalize ? (
                <ShieldCheck aria-hidden="true" weight="regular" />
              ) : (
                <Clock aria-hidden="true" weight="regular" />
              )}
            </div>
            <p className={styles.eyebrow}>{pendingEyebrow}</p>
            <h2>{pendingTitle}</h2>
            <p>
              {creatorCanFinalize
                ? "The conserved payout calculation can now be frozen and handed to the transfer worker."
                : "Missing evidence becomes missed. A clarification, dispute, or open review keeps payout calculation safely paused."}
            </p>
            <div className={styles.pendingFacts}>
              <article>
                <strong>Immutable</strong>
                <span>Final outcomes cannot change after calculation</span>
              </article>
              <article>
                <strong>Conserved</strong>
                <span>Every deposited Luna is allocated exactly once</span>
              </article>
            </div>
            {creatorCanFinalize ? (
              <SettlementFinalizeButton podId={podId} />
            ) : null}
          </section>
        ) : creator?.settlement ? (
          <SettlementSummary
            entitlementCount={creator.entitlements.length}
            entitlements={creator.entitlements}
            mode="creator"
            occurrenceCount={creator.occurrences.length}
            podId={podId}
            settlement={creator.settlement}
          />
        ) : participant?.entitlement && participant.settlement ? (
          <SettlementSummary
            entitlement={participant.entitlement}
            mode="participant"
            outcomes={participant.outcomes}
            podId={podId}
            settlement={participant.settlement}
            transfer={participant.transfer}
          />
        ) : null}
      </div>
    </main>
  );
}
