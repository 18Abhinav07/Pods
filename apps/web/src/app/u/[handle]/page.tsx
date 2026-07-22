import Link from "next/link";
import { notFound } from "next/navigation";

import { ProfileAvatar } from "../../../components/profile-avatar";
import { SocialProfileActions } from "../../../components/social-profile-actions";
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
      <main className="foundation-shell public-profile-shell">
        <header className="app-topbar"><Link className="wordmark" href="/discover?view=people"><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link></header>
        <section className="private-public-profile">
          <span aria-hidden="true">P</span>
          <p className="eyebrow">Private profile</p>
          <h1>This Pods profile is private.</h1>
          <p>You can still meet this person inside a shared Pod without exposing their wider activity history.</p>
          <Link className="primary-action" href="/discover">Discover public Pods</Link>
        </section>
      </main>
    );
  }

  const profile = presence.profile;
  return (
    <main className="foundation-shell public-profile-shell">
      <header className="public-profile-header"><Link className="wordmark" href="/discover?view=people"><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link><span>@{profile.handle}</span></header>
      <section className="public-profile-cover">
        <ProfileAvatar avatar={profile.avatar} displayName={profile.displayName} size="cover" priority />
        <div className="public-profile-cover-shade" />
        <div className="public-profile-cover-copy">
          <span>Public profile</span>
          <h1>{profile.displayName}</h1>
          <p>{profile.bio || "Moving with intention on Pods."}</p>
        </div>
      </section>
      <dl className="public-profile-stats">
        <div><dt>Followers</dt><dd>{presence.counts.followers}</dd></div>
        <div><dt>Following</dt><dd>{presence.counts.following}</dd></div>
        <div><dt>Activity</dt><dd>{profile.activityStatusVisible ? "On" : "Off"}</dd></div>
      </dl>
      {!presence.relationship.self ? session ? <SocialProfileActions handle={profile.handle} initial={{ following: presence.relationship.following, friend: presence.relationship.friend, request: presence.relationship.request, messageRequestsAllowed: presence.messageRequestsAllowed }} /> : <Link className="primary-action full-action" href={`/connect?returnTo=${encodeURIComponent(`/u/${profile.handle}`)}`}>Connect to follow</Link> : null}
      <section className="public-profile-activity-empty">
        <span>Activity</span>
        <h2>No public milestones yet.</h2>
        <p>Completed public Pods and earned streaks will appear here.</p>
      </section>
      <Link className="public-profile-explore" href="/discover?view=people">Explore people</Link>
    </main>
  );
}
