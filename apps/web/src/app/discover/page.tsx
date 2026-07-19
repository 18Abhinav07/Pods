import Link from "next/link";

import { PrimaryNav } from "../../components/primary-nav";

export default function DiscoverPage() {
  return <main className="app-shell"><header className="app-topbar"><Link className="wordmark" href="/"><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link><span className="phase-pill">Public space</span></header><section className="today-hero entrance entrance-hero"><p className="eyebrow">Discover</p><h1>Public activities arrive next.</h1><p className="screen-copy">Phase 1 locks trustworthy creation first. Phase 2 adds applications, acceptance, and public discovery without weakening private Pod boundaries.</p></section><section className="empty-state entrance entrance-status"><span className="empty-index">02</span><h2>Create the first contract.</h2><p>Your published Pod is ready for the enrollment system that follows this gate.</p><Link className="primary-action full-action" href="/pods/create/template">Create a Pod</Link></section><PrimaryNav active="discover" /></main>;
}
