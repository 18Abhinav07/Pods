import { InvitationLanding } from "../../components/invitation-landing";
import { getCurrentSession } from "../../lib/session";

export default async function InvitePage() {
  const session = await getCurrentSession();
  return <InvitationLanding connected={Boolean(session)} />;
}
