import Link from "next/link";
import { notFound } from "next/navigation";

import { AppHeader } from "../../../../components/app-header";
import { ProfileAvatar } from "../../../../components/profile-avatar";
import { profileForSession } from "../../../../lib/profile-presentation";
import { podsRepository } from "../../../../lib/server-db";
import { requireSession } from "../../../../lib/session";

export default async function PodMembersPage({ params }: { params: Promise<{ podId: string }> }) {
  const { podId } = await params;
  const session = await requireSession(`/pods/${podId}/members`);
  let loaded: Awaited<ReturnType<typeof loadMembers>>;
  try {
    loaded = await loadMembers(session.userId, podId);
  } catch {
    notFound();
  }
  if (!loaded.room?.pod.contractData) notFound();
  return (
    <main className="app-shell pod-reference-shell">
      <AppHeader profile={profileForSession(session)} title="Members" />
      <Link className="pod-reference-back" href={`/pods/${podId}/room`}>← Back to room</Link>
      <section className="pod-reference-intro"><span>Locked roster</span><h1>The people showing up.</h1><p>Wallet addresses, evidence, and personal financial details are never shown here.</p></section>
      <section className="pod-member-list">
        {loaded.members.map((member) => (
          <Link className="pod-member-card" href={`/u/${member.handle}`} key={member.handle}>
            <ProfileAvatar avatar={member.avatar} displayName={member.displayName} />
            <div><strong>{member.displayName}</strong><span>@{member.handle}</span></div>
            <small>{member.role}</small>
          </Link>
        ))}
      </section>
    </main>
  );
}

async function loadMembers(userId: string, podId: string) {
  await podsRepository.ensurePodConversation({ podId, userId });
  const [room, members] = await Promise.all([
    podsRepository.getWaitingRoomForUser({ userId, podId }),
    podsRepository.listPodRoomMembers({ podId, userId })
  ]);
  return { room, members };
}
