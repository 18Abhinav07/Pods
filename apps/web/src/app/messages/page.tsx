import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "../../components/app-header";
import { DirectRequestList } from "../../components/direct-request-list";
import { FriendRequestList } from "../../components/friend-request-list";
import { PrimaryNav } from "../../components/primary-nav";
import { ProfileAvatar } from "../../components/profile-avatar";
import styles from "../../components/social-flow.module.css";
import { TargetedInvitationList } from "../../components/targeted-invitation-list";
import { profileForSession } from "../../lib/profile-presentation";
import { podsRepository } from "../../lib/server-db";
import { requireSession } from "../../lib/session";

export default async function MessagesPage({
  searchParams
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await requireSession("/messages");
  const { view } = await searchParams;
  if (view === "pods") redirect("/my-pods");
  const active = view === "requests" ? "requests" : "people";
  const friends =
    active === "people" ? await podsRepository.listFriends(session.userId) : [];
  const friendRequests =
    active === "requests"
      ? await podsRepository.listFriendRequests(session.userId)
      : [];
  const directConversations =
    active === "people"
      ? await podsRepository.listDirectConversationSummaries(session.userId)
      : [];
  const directRequests =
    active === "requests"
      ? await podsRepository.listDirectConversationRequests(session.userId)
      : [];
  const targetedInvitations =
    active === "requests"
      ? await podsRepository.listTargetedInvitations(session.userId, new Date())
      : [];
  const availableFriends = friends.filter(
    (friend) =>
      !directConversations.some(({ peer }) => peer.handle === friend.handle)
  );

  return (
    <main className={`app-shell ${styles.page}`}>
      <AppHeader profile={profileForSession(session)} title="Messages" />
      <p className={styles.routeIntro}>
        Private conversations and decisions that need you.
      </p>
      <nav
        className={styles.tabs}
        aria-label="Message sections"
      >
        <Link
          aria-current={active === "people" ? "page" : undefined}
          href="/messages"
        >
          People
        </Link>
        <Link
          aria-current={active === "requests" ? "page" : undefined}
          href="/messages?view=requests"
        >
          Requests
        </Link>
      </nav>

      {active === "people" &&
      (directConversations.length > 0 || availableFriends.length > 0) ? (
        <>
          {directConversations.length > 0 ? (
            <section className={styles.conversationList} aria-label="Conversations">
              {directConversations.map((conversation) => (
                <Link
                  className={`${styles.card} ${styles.conversationCard}`}
                  href={`/messages/${conversation.id}`}
                  key={conversation.id}
                >
                  <ProfileAvatar
                    avatar={conversation.peer.avatar}
                    displayName={conversation.peer.displayName}
                  />
                  <span className={styles.conversationCopy}>
                    <span className={styles.conversationNameRow}>
                      <strong>{conversation.peer.displayName}</strong>
                      {conversation.unreadCount > 0 ? (
                        <i className={styles.unreadPill}>
                          {conversation.unreadCount}
                        </i>
                      ) : null}
                    </span>
                    <small>@{conversation.peer.handle}</small>
                    <p>{conversation.lastMessage}</p>
                  </span>
                  <span className={styles.arrow} aria-hidden="true">
                    <ArrowRight size={17} weight="bold" />
                  </span>
                </Link>
              ))}
            </section>
          ) : null}

          {availableFriends.length > 0 ? (
            <section className={styles.friendList} aria-labelledby="friend-message-title">
              <header className={styles.sectionHeader}>
                <div>
                  <span>Friends</span>
                  <h2 id="friend-message-title">Start a conversation</h2>
                </div>
                <small>{availableFriends.length}</small>
              </header>
              {availableFriends.map((friend) => (
                <article
                  className={`${styles.card} ${styles.friendCard}`}
                  key={friend.handle}
                >
                  <ProfileAvatar
                    avatar={friend.avatar}
                    displayName={friend.displayName}
                  />
                  <span>
                    <strong>{friend.displayName}</strong>
                    <small>@{friend.handle}</small>
                  </span>
                  <Link
                    className={styles.compactLink}
                    href={`/messages/new?handle=${friend.handle}`}
                  >
                    Message
                  </Link>
                </article>
              ))}
            </section>
          ) : null}
        </>
      ) : active === "requests" &&
        (friendRequests.length > 0 ||
          directRequests.length > 0 ||
          targetedInvitations.length > 0) ? (
        <section className={styles.requestLanes}>
          <TargetedInvitationList initialInvitations={targetedInvitations} />
          <DirectRequestList initialRequests={directRequests} />
          <FriendRequestList initialRequests={friendRequests} />
        </section>
      ) : (
        <section className={styles.empty}>
          <h2>
            {active === "people" ? "No conversations yet." : "No requests waiting."}
          </h2>
          <p>
            {active === "people"
              ? "Search for a public profile or message a friend."
              : "New invitations and introductions will appear here."}
          </p>
          {active === "people" ? (
            <Link className={styles.primaryButton} href="/people/search">
              Find people
            </Link>
          ) : null}
        </section>
      )}
      <PrimaryNav active="messages" />
    </main>
  );
}
