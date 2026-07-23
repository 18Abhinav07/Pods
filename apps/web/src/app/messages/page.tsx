import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "../../components/app-header";
import { PrimaryNav } from "../../components/primary-nav";
import { FriendRequestList } from "../../components/friend-request-list";
import { DirectRequestList } from "../../components/direct-request-list";
import { TargetedInvitationList } from "../../components/targeted-invitation-list";
import { ProfileAvatar } from "../../components/profile-avatar";
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
  const friends = active === "people" ? await podsRepository.listFriends(session.userId) : [];
  const friendRequests = active === "requests" ? await podsRepository.listFriendRequests(session.userId) : [];
  const directConversations = active === "people" ? await podsRepository.listDirectConversationSummaries(session.userId) : [];
  const directRequests = active === "requests" ? await podsRepository.listDirectConversationRequests(session.userId) : [];
  const targetedInvitations = active === "requests" ? await podsRepository.listTargetedInvitations(session.userId, new Date()) : [];
  return (
    <main className="app-shell messages-shell">
      <AppHeader profile={profileForSession(session)} title="Messages" />
      <p className="route-lede entrance entrance-hero">Private conversations and requests.</p>
      <nav className="message-segments is-compact-switch" aria-label="Message sections">
        <Link aria-current={active === "people" ? "page" : undefined} href="/messages">People</Link>
        <Link aria-current={active === "requests" ? "page" : undefined} href="/messages?view=requests">Requests</Link>
      </nav>
      {active === "people" && (directConversations.length > 0 || friends.length > 0) ? <section className="people-message-lists">{directConversations.length > 0 ? <div className="conversation-list">{directConversations.map((conversation) => <Link className="conversation-row" href={`/messages/${conversation.id}`} key={conversation.id}><ProfileAvatar avatar={conversation.peer.avatar} displayName={conversation.peer.displayName} /><span><small>{conversation.unreadCount > 0 ? `${conversation.unreadCount} unread` : `@${conversation.peer.handle}`}</small><strong>{conversation.peer.displayName}</strong><p>{conversation.lastMessage}</p></span><i aria-hidden="true">›</i></Link>)}</div> : null}{friends.filter((friend) => !directConversations.some(({ peer }) => peer.handle === friend.handle)).length > 0 ? <div className="friend-list">{friends.filter((friend) => !directConversations.some(({ peer }) => peer.handle === friend.handle)).map((friend) => <article key={friend.handle}><ProfileAvatar avatar={friend.avatar} displayName={friend.displayName} /><span><strong>{friend.displayName}</strong><small>@{friend.handle}</small></span><Link href={`/messages/new?handle=${friend.handle}`}>Message</Link></article>)}</div> : null}</section> : active === "requests" && (friendRequests.length > 0 || directRequests.length > 0 || targetedInvitations.length > 0) ? <section className="request-lanes"><TargetedInvitationList initialInvitations={targetedInvitations} /><DirectRequestList initialRequests={directRequests} /><FriendRequestList initialRequests={friendRequests} /></section> : <section className="messages-empty">
        <h2>{active === "people" ? "No conversations yet." : "No requests."}</h2>
        <p>{active === "people" ? "Find a person and start a conversation." : "New invitations and introductions appear here."}</p>
        {active === "people" ? <Link className="primary-action" href="/people/search">Find people</Link> : null}
      </section>}
      <PrimaryNav active="messages" />
    </main>
  );
}
