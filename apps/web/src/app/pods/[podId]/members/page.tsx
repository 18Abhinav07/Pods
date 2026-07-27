import Link from "next/link";
import { notFound } from "next/navigation";

import { AppHeader } from "../../../../components/app-header";
import { ProfileAvatar } from "../../../../components/profile-avatar";
import { profileForSession } from "../../../../lib/profile-presentation";
import { podsRepository } from "../../../../lib/server-db";
import { requireSession } from "../../../../lib/session";
import styles from "../../../../components/pod-reference-flow.module.css";

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
    <main className={styles.shell}>
      <AppHeader profile={profileForSession(session)} title="Members" />
      <Link className={styles.roomLink} href={`/pods/${podId}/room`}>Pod room</Link>
      <section className={styles.intro}>
        <span>Locked roster</span>
        <h1>{loaded.members.length} people</h1>
        <p>Profiles and Pod roles only. Wallet and financial details stay private.</p>
      </section>
      <section className={styles.memberList}>
        {loaded.members.map((member) => (
          <Link className={styles.memberCard} href={`/u/${member.handle}`} key={member.handle}>
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
