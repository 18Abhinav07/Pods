import Link from "next/link";
import { notFound } from "next/navigation";

import { ProfileAvatar } from "../../../../../components/profile-avatar";
import { publicVisitorRoomsEnabled } from "../../../../../lib/alpha-access";
import { isUuidRouteParam } from "../../../../../lib/route-params";
import { podsRepository } from "../../../../../lib/server-db";
import styles from "../../../../../components/pod-reference-flow.module.css";

export default async function PublicPodContributorPage({
  params
}: {
  params: Promise<{ podId: string; handle: string }>;
}) {
  if (!publicVisitorRoomsEnabled(process.env)) notFound();
  const { podId, handle } = await params;
  if (!isUuidRouteParam(podId)) notFound();
  const contributor = await podsRepository.getPublicPodContributor({
    podId,
    handle
  });
  if (!contributor) notFound();

  return (
    <main className={styles.shell}>
      <header className={styles.simpleHeader}>
        <Link href={`/pods/${podId}/room`}>
          <span className="pod-mark" aria-hidden="true" />
          pods
        </Link>
        <span className={styles.frozenPill}>Pod contributor</span>
      </header>
      <section className={styles.contributorCard}>
        <div className={styles.contributorPortrait}>
          <ProfileAvatar
            avatar={contributor.avatar}
            displayName={contributor.displayName}
            size="large"
          />
          <span>{contributor.role === "creator" ? "Pod creator" : "Locked member"}</span>
          <h1>{contributor.displayName}</h1>
          <p>@{contributor.handle}</p>
        </div>
        <section className={styles.contributorStats} aria-label="Public Pod activity">
          <div>
            <strong>{contributor.commitmentCount}</strong>
            <span>commitments</span>
          </div>
          <div>
            <strong>{contributor.submittedProofCount}</strong>
            <span>public proofs</span>
          </div>
        </section>
      </section>
      <p className={styles.boundary}>
        This identity is scoped to the public Pod. Private profile details and wallet information are not shown.
      </p>
      {contributor.fullProfileAvailable ? (
        <Link className={styles.primaryLink} href={`/u/${contributor.handle}`}>
          Open full profile
        </Link>
      ) : null}
      <Link className={styles.secondaryLink} href={`/pods/${podId}/room`}>
        Return to public room
      </Link>
    </main>
  );
}

export const metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true
  }
};
