import Link from "next/link";
import { notFound } from "next/navigation";

import { ProfileAvatar } from "../../../components/profile-avatar";
import { SocialProfileActions } from "../../../components/social-profile-actions";
import styles from "../../../components/social-flow.module.css";
import { podsRepository } from "../../../lib/server-db";
import { getCurrentSession } from "../../../lib/session";

export default async function PublicProfilePage({
  params
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const session = await getCurrentSession();
  const presence = await podsRepository.getSocialProfilePresence({
    viewerUserId: session?.userId ?? null,
    handle
  });
  if (presence.kind === "not_found") notFound();

  if (presence.kind === "private") {
    return (
      <main className={styles.publicPage}>
        <header className={styles.publicHeader}>
          <Link href="/discover">pods</Link>
          <span>Private profile</span>
        </header>
        <section className={styles.privateState}>
          <span className={styles.privateMark} aria-hidden="true">
            P
          </span>
          <h1>This Pods profile is private</h1>
          <p>
            You can still meet this person inside a shared Pod without exposing
            their wider activity history.
          </p>
          <Link className={styles.primaryButton} href="/discover">
            Discover public Pods
          </Link>
        </section>
      </main>
    );
  }

  const profile = presence.profile;
  return (
    <main className={styles.publicPage}>
      <header className={styles.publicHeader}>
        <Link href="/discover">pods</Link>
        <span>@{profile.handle}</span>
      </header>
      <section
        className={`public-profile-cover is-profile-showcase ${styles.publicHero}`}
      >
        <div className={styles.publicPortrait}>
          <ProfileAvatar
            avatar={profile.avatar}
            displayName={profile.displayName}
            priority
            size="cover"
          />
        </div>
        <div className={styles.publicCopy}>
          <span>@{profile.handle}</span>
          <h1>{profile.displayName}</h1>
          <p>{profile.bio || "Moving with intention on Pods."}</p>
        </div>
        <dl className={`public-profile-stats ${styles.stats}`}>
          <div>
            <dt>Followers</dt>
            <dd>{presence.counts.followers}</dd>
          </div>
          <div>
            <dt>Following</dt>
            <dd>{presence.counts.following}</dd>
          </div>
          <div>
            <dt>Activity</dt>
            <dd>{profile.activityStatusVisible ? "Shown" : "Hidden"}</dd>
          </div>
        </dl>
        {!presence.relationship.self ? (
          session ? (
            <SocialProfileActions
              handle={profile.handle}
              initial={{
                following: presence.relationship.following,
                friend: presence.relationship.friend,
                request: presence.relationship.request,
                messageRequestsAllowed: presence.messageRequestsAllowed
              }}
            />
          ) : (
            <div className={styles.profileActions}>
              <Link
                className={styles.primaryButton}
                href={`/connect?returnTo=${encodeURIComponent(`/u/${profile.handle}`)}`}
              >
                Connect
              </Link>
            </div>
          )
        ) : null}
      </section>

      <section className={styles.publicActivity}>
        <span>Public activity</span>
        <h2>No public milestones yet</h2>
        <p>Completed public Pods and earned streaks will appear here.</p>
      </section>
      <Link
        aria-label="Find people"
        className={styles.exploreLink}
        href="/people/search"
      >
        Find people
      </Link>
    </main>
  );
}
