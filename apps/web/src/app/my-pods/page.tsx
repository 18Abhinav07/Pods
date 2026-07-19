import { templateContracts } from "@pods/domain";
import Link from "next/link";

import { PrimaryNav } from "../../components/primary-nav";
import { podsRepository } from "../../lib/server-db";
import { requireSession } from "../../lib/session";

export default async function MyPodsPage() {
  const session = await requireSession("/my-pods");
  const pods = await podsRepository.listPodsForOwner(session.userId);
  return <main className="app-shell"><header className="app-topbar"><Link className="wordmark" href="/today"><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link><Link className="phase-pill" href="/pods/create/template">New Pod</Link></header><section className="today-hero entrance entrance-hero"><p className="eyebrow">My Pods</p><h1>Drafts and frozen contracts.</h1><p className="screen-copy">Drafts remain editable. Published terms do not.</p></section>{pods.length === 0 ? <section className="empty-state"><span className="empty-index">00</span><h2>No Pods yet.</h2><p>Start with one of the five fixed activity templates.</p><Link className="primary-action full-action" href="/pods/create/template">Create a Pod</Link></section> : <div className="my-pods-list">{pods.map((pod) => { const template = templateContracts.find((item) => item.id === pod.templateId); const name = pod.contractData?.activity.name ?? pod.draftData.activity?.name ?? "Untitled Pod"; const href = pod.state === "draft" ? `/pods/create/${pod.draftData.activity ? pod.draftData.community ? pod.draftData.commitment ? "review" : "commitment" : "community" : "activity"}?draft=${pod.id}` : `/pods/${pod.id}/rules`; return <Link className="my-pod-row" href={href} key={pod.id}><span className="template-icon">{templateContracts.findIndex((item) => item.id === pod.templateId) + 1}</span><span><strong>{name}</strong><small>{template?.name}</small></span><b>{pod.state === "draft" ? "Resume" : "Frozen"}</b></Link>; })}</div>}<PrimaryNav active="my-pods" /></main>;
}
