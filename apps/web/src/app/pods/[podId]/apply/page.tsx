import { isPublicVisitorContract } from "@pods/domain";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import styles from "../../../../components/acquisition-flow.module.css";
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
    <main className={`app-shell application-shell ${styles.shell} ${styles.applicationShell}`}>
      <header className={`app-topbar ${styles.topbar}`}>
        <Link className={`wordmark ${styles.wordmark}`} href={`/pods/${podId}`}><span className="pod-mark" aria-hidden="true" />pods</Link>
        <span className={styles.routeLabel}>Application</span>
      </header>
      <section className={`${styles.intro} ${styles.applicationIntro}`}>
        <p className={styles.routeLabel}>Apply to join</p>
        <h1>{contract.activity.name}</h1>
        <p className="screen-copy">Your answers are frozen with this application and visible to the Pod creator.</p>
      </section>
      <ApplicationForm
        podId={podId}
        questions={contract.community.applicationQuestions}
        visitorConsent={
          isPublicVisitorContract(contract) &&
          pod.contractHash
            ? { contractHash: pod.contractHash }
            : null
        }
      />
    </main>
  );
}
