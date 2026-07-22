import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileOnboardingForm } from "../../../components/profile-onboarding-form";
import { safeReturnTarget } from "../../../lib/auth";
import { podsRepository } from "../../../lib/server-db";
import { getCurrentSession } from "../../../lib/session";

export default async function ProfileOnboardingPage({
  searchParams
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  const returnTo = safeReturnTarget(params.returnTo);
  const session = await getCurrentSession();
  if (!session) {
    redirect(
      `/connect?returnTo=${encodeURIComponent(
        `/onboarding/profile?returnTo=${encodeURIComponent(returnTo)}`
      )}`
    );
  }
  const profile = await podsRepository.getProfileForUser(session.userId);
  if (profile) redirect(returnTo);

  return (
    <main className="profile-onboarding-shell">
      <header className="onboarding-topbar">
        <Link className="wordmark" href="/" aria-label="Pods home">
          <span className="pod-mark" aria-hidden="true" />
          pods
        </Link>
      </header>
      <ProfileOnboardingForm returnTo={returnTo} />
    </main>
  );
}
