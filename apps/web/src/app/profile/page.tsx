import Link from "next/link";

import { ProfileAvatar } from "../../components/profile-avatar";
import { ProfileSettingsSheet } from "../../components/profile-settings-sheet";
import { podsRepository } from "../../lib/server-db";
import { requireSession } from "../../lib/session";

export default async function ProfilePage() {
  const session = await requireSession("/profile");
  const profile = session.profile;
  const [following, friends] = await Promise.all([
    podsRepository.listFollowingProfiles(session.userId),
    podsRepository.listFriends(session.userId)
  ]);

  return (
    <main className="app-shell private-profile-shell">
      <header className="profile-page-header">
        <Link className="wordmark" href="/today"><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link>
        <ProfileSettingsSheet
          profile={{
            handle: profile.handle,
            displayName: profile.displayName,
            bio: profile.bio,
            avatar: profile.avatar,
            visibility: profile.visibility,
            dmPolicy: profile.dmPolicy,
            activityStatusVisible: profile.activityStatusVisible
          }}
          walletAddress={session.walletAddress}
        />
      </header>

      <section className="private-profile-cover entrance entrance-hero">
        <ProfileAvatar avatar={profile.avatar} displayName={profile.displayName} size="large" priority />
        <div className="private-profile-copy">
          <span>@{profile.handle}</span>
          <h1>{profile.displayName}</h1>
          <p>{profile.bio || "Add a short introduction from settings."}</p>
        </div>
      </section>

      <section className="profile-signal-strip entrance entrance-status" aria-label="Profile preferences">
        <div><strong>{profile.visibility === "public" ? "Public" : "Private"}</strong><span>Profile</span></div>
        <div><strong>{profile.dmPolicy === "requests" ? "Requests" : profile.dmPolicy === "friends" ? "Friends" : "Off"}</strong><span>Messages</span></div>
        <div><strong>{profile.activityStatusVisible ? "On" : "Off"}</strong><span>Activity</span></div>
      </section>

      <section className="profile-people entrance entrance-status" aria-labelledby="profile-people-title">
        <div className="profile-section-head">
          <div>
            <span>Connections</span>
            <h2 id="profile-people-title">Your people</h2>
          </div>
          <Link className="profile-search-link" href="/people/search" aria-label="Search people">
            <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="5.8" /><path d="m15.3 15.3 4.2 4.2" /></svg>
          </Link>
        </div>
        <div className="profile-people-lanes">
          <div className="profile-people-lane">
            <h3>Following <span>{following.length}</span></h3>
            {following.length > 0 ? following.slice(0, 4).map((person) => (
              <Link className="profile-person-row" href={`/u/${person.handle}`} key={`following-${person.handle}`}>
                <ProfileAvatar avatar={person.avatar} displayName={person.displayName} size="small" />
                <span><strong>{person.displayName}</strong><small>@{person.handle}</small></span>
              </Link>
            )) : <p>No followed profiles yet.</p>}
          </div>
          <div className="profile-people-lane">
            <h3>Friends <span>{friends.length}</span></h3>
            {friends.length > 0 ? friends.slice(0, 4).map((person) => (
              <Link className="profile-person-row" href={`/u/${person.handle}`} key={`friend-${person.handle}`}>
                <ProfileAvatar avatar={person.avatar} displayName={person.displayName} size="small" />
                <span><strong>{person.displayName}</strong><small>@{person.handle}</small></span>
              </Link>
            )) : <p>No friends yet.</p>}
          </div>
        </div>
      </section>

      <p className="profile-privacy-note">Your wallet and private Pod activity stay off your social profile.</p>
    </main>
  );
}
