import Link from "next/link";

import { ApplicationDecisionList } from "../../../../../components/application-decision-list";
import styles from "../../../../../components/pod-admin-flow.module.css";
import { requireEnrollmentOwner } from "../../../../../lib/enrollment-guards";
import { podsRepository } from "../../../../../lib/server-db";

export default async function AdminApplicationsPage({
  params,
  searchParams
}: {
  params: Promise<{ podId: string }>;
  searchParams: Promise<{ application?: string }>;
}) {
  const { podId } = await params;
  const { application: selectedApplicationId } = await searchParams;
  const { session, pod } = await requireEnrollmentOwner(podId, `/pods/${podId}/admin/applications`);
  const contract = pod.contractData;
  if (!contract) return null;
  if (contract.community.visibility !== "public") {
    return <main className="app-shell"><section className="neutral-empty"><span>Not available</span><p>Private Pods use invitation acceptance, not public applications.</p><Link className="secondary-action full-action" href={`/pods/${podId}/admin`}>Return to creator controls</Link></section></main>;
  }
  const records = await podsRepository.listApplicationsForCreator({ creatorUserId: session.userId, podId });
  const pending = records.filter(({ application }) => application.state === "applied");
  const selected = selectedApplicationId
    ? pending.find(({ application }) => application.id === selectedApplicationId)
    : null;

  return (
    <main className={styles.applicationPage}>
      <header className={styles.applicationHeader}>
        <Link href={`/pods/${podId}/admin`}>Creator controls</Link>
        <span>{selected ? "Applicant review" : "Applications"}</span>
      </header>
      <section className={styles.applicationHero}>
        <p>{selected ? "One applicant" : "Enrollment decisions"}</p>
        <h1>{selected ? selected.applicantProfile.displayName : `${pending.length} ${pending.length === 1 ? "person is" : "people are"} waiting.`}</h1>
        <small>{selected ? "Review their answers before making one final enrollment decision." : "Open one profile at a time. Wallet addresses stay private."}</small>
      </section>
      <ApplicationDecisionList
        applications={pending.map(({ application, applicantProfile }) => ({
          id: application.id,
          applicant: applicantProfile,
          answers: application.answers
        }))}
        podId={podId}
        {...(selectedApplicationId ? { selectedApplicationId } : {})}
      />
    </main>
  );
}
