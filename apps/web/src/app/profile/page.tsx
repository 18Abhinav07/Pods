import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { ProfileAvatar } from "../../components/profile-avatar";
import { ProfileSettingsSheet } from "../../components/profile-settings-sheet";
import styles from "../../components/social-flow.module.css";
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
    <main className={`app-shell ${styles.page}`}>
      <header className={styles.profileHeader}>
        <Link href="/today">pods</Link>
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

      <section
        className={`private-profile-cover is-compact-identity ${styles.identityCard}`}
      >
        <ProfileAvatar
          avatar={profile.avatar}
          displayName={profile.displayName}
          priority
          size="large"
        />
        <div className={styles.identityCopy}>
          <span>@{profile.handle}</span>
          <h1>{profile.displayName}</h1>
          <p>{profile.bio || "Add a short introduction from settings."}</p>
        </div>
      </section>

      <section className={styles.peopleSection} aria-labelledby="profile-people-title">
        <header className={styles.sectionHeader}>
          <div>
            <span>Private connections</span>
            <h2 id="profile-people-title">Your people</h2>
          </div>
          <Link
            aria-label="Search people"
            className={styles.arrow}
            href="/people/search"
          >
            <MagnifyingGlass aria-hidden="true" size={17} weight="bold" />
          </Link>
        </header>

        <div className={styles.peopleLanes}>
          <section className={styles.peopleCard} aria-label="Following">
            <h3>
              Following <span>{following.length}</span>
            </h3>
            {following.length > 0 ? (
              following.slice(0, 4).map((person) => (
                <Link
                  className={`profile-person-row ${styles.personRow}`}
                  href={`/u/${person.handle}`}
                  key={`following-${person.handle}`}
                >
                  <ProfileAvatar
                    avatar={person.avatar}
                    displayName={person.displayName}
                    size="small"
                  />
                  <span>
                    <strong>{person.displayName}</strong>
                    <small>@{person.handle}</small>
                  </span>
                </Link>
              ))
            ) : (
              <p>No followed profiles yet.</p>
            )}
          </section>

          <section className={styles.peopleCard} aria-label="Friends">
            <h3>
              Friends <span>{friends.length}</span>
            </h3>
            {friends.length > 0 ? (
              friends.slice(0, 4).map((person) => (
                <Link
                  className={`profile-person-row ${styles.personRow}`}
                  href={`/u/${person.handle}`}
                  key={`friend-${person.handle}`}
                >
                  <ProfileAvatar
                    avatar={person.avatar}
                    displayName={person.displayName}
                    size="small"
                  />
                  <span>
                    <strong>{person.displayName}</strong>
                    <small>@{person.handle}</small>
                  </span>
                </Link>
              ))
            ) : (
              <p>No friends yet.</p>
            )}
          </section>
        </div>
      </section>

      <p className={styles.privacyNote}>
        Your wallet and private Pod activity stay off your public profile.
      </p>
    </main>
  );
}
