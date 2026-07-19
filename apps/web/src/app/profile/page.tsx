import Link from "next/link";

import { requireSession } from "../../lib/session";

export default async function ProfilePage() {
  const session = await requireSession("/profile");
  return <main className="app-shell"><header className="app-topbar"><Link className="wordmark" href="/today"><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link><span className="phase-pill">Private profile</span></header><section className="today-hero"><p className="eyebrow">Wallet identity</p><h1>Your Pods profile starts private.</h1><p className="screen-copy">Public profile controls arrive with the activity history they govern. Your connected wallet is never displayed publicly by default.</p></section><div className="profile-wallet"><span>Connected Nimiq wallet</span><code>{session.walletAddress}</code></div><Link className="secondary-action full-action" href="/today">Return to Today</Link></main>;
}
