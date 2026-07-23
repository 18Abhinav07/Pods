import Link from "next/link";
import { notFound } from "next/navigation";

import { PodRoom, type RoomMessage } from "../../../components/pod-room";
import { ProfileAvatar } from "../../../components/profile-avatar";
import { podsRepository } from "../../../lib/server-db";
import { requireSession } from "../../../lib/session";

export default async function DirectMessagePage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const session = await requireSession(`/messages/${conversationId}`);
  let loaded: Awaited<ReturnType<typeof loadDirectMessage>>;
  try {
    loaded = await loadDirectMessage(session.userId, conversationId);
  } catch {
    notFound();
  }
  if (!loaded.summary) notFound();
  const { initial, messages, summary } = loaded;
  return <main className="app-shell direct-thread-shell"><header className="direct-thread-header"><Link href="/messages" aria-label="Back to messages">‹</Link><ProfileAvatar avatar={summary.peer.avatar} displayName={summary.peer.displayName} size="small" /><span><strong>{summary.peer.displayName}</strong><small>@{summary.peer.handle}</small></span><Link href={`/u/${summary.peer.handle}`}>Profile</Link></header><PodRoom conversationId={conversationId} initialChangeCursor={initial.conversation.changeCursor} initialLastSequence={initial.conversation.lastSequence} initialMessages={messages} initialPeerReadSequence={initial.conversation.peerReadSequence} isCreator={false} mode="direct" podId="" roomState="open" viewer={{ avatar: session.profile.avatar, displayName: session.profile.displayName, handle: session.profile.handle }} /></main>;
}

async function loadDirectMessage(userId: string, conversationId: string) {
  const [summaries, initial] = await Promise.all([
    podsRepository.listDirectConversationSummaries(userId),
    podsRepository.listConversationMessages({ conversationId, userId, afterSequence: 0, limit: 100 })
  ]);
  const summary = summaries.find(({ id }) => id === conversationId) ?? null;
  const messages: RoomMessage[] = initial.messages.map((message) => ({
    ...message,
    createdAt: message.createdAt.toISOString()
  }));
  return { initial, messages, summary };
}
