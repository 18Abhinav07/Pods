import Link from "next/link";

import { ReportProfileForm } from "../../../components/report-profile-form";
import { requireSession } from "../../../lib/session";

export default async function ReportProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  await requireSession(`/report/${handle}`);
  return <main className="app-shell report-profile-shell"><header className="app-topbar"><Link className="wordmark" href={`/u/${handle}`}><span className="pod-mark" aria-hidden="true" />pods</Link><span className="phase-pill">Private report</span></header><section className="pod-reference-intro"><span>Safety</span><h1>Report @{handle}</h1><p>Reports go to Pods operations. The reported person is not notified by this form.</p></section><ReportProfileForm handle={handle} /></main>;
}
