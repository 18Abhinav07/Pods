import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppHeader } from "../../../../components/app-header";
import { ArtifactLinkCard } from "../../../../components/artifact-link-card";
import { ProfileAvatar } from "../../../../components/profile-avatar";
import { profileForSession } from "../../../../lib/profile-presentation";
import { podsRepository } from "../../../../lib/server-db";
import { requireSession } from "../../../../lib/session";
import { presentTemplateEvidence } from "../../../../lib/template-evidence-presentation";
import styles from "../../../../components/pod-reference-flow.module.css";

function proofStateLabel(state: string) {
  if (state === "submitted" || state === "reviewing") return "Creator review";
  if (state === "approved") return "Approved";
  if (state === "rejected") return "Not verified";
  if (state === "grace") return "Grace applied";
  if (state === "timeout_protected") return "Protected after review timeout";
  return "Submitted";
}

function pageHref(podId: string, input: { query: string; mine: boolean; page: number }) {
  const params = new URLSearchParams();
  if (input.query) params.set("q", input.query);
  if (input.mine) params.set("scope", "mine");
  if (input.page > 1) params.set("page", String(input.page));
  const query = params.toString();
  return `/pods/${podId}/activity${query ? `?${query}` : ""}`;
}

export default async function PodActivityPage({
  params,
  searchParams
}: {
  params: Promise<{ podId: string }>;
  searchParams: Promise<{ q?: string; scope?: string; page?: string }>;
}) {
  const { podId } = await params;
  const queryParams = await searchParams;
  const session = await requireSession(`/pods/${podId}/activity`);
  const query = (queryParams.q ?? "").trim().slice(0, 60);
  const mine = queryParams.scope === "mine";
  const parsedPage = Number.parseInt(queryParams.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const feed = await podsRepository.listPodVisibleSubmissions({
    userId: session.userId,
    podId,
    memberQuery: query,
    viewerOnly: mine,
    page,
    limit: 20
  });
  if (!feed) notFound();

  return (
    <main className={styles.shell}>
      <AppHeader profile={profileForSession(session)} title="Proofs" />
      <Link className={styles.roomLink} href={`/pods/${podId}/room`}>Pod room</Link>

      <section className={styles.proofControls} data-proof-history-controls aria-label="Proof filters">
        <nav className={styles.segmented} aria-label="Proof scope">
          <Link aria-current={!mine ? "page" : undefined} href={pageHref(podId, { query, mine: false, page: 1 })}>All proofs</Link>
          <Link aria-current={mine ? "page" : undefined} href={pageHref(podId, { query, mine: true, page: 1 })}>My proofs</Link>
        </nav>
        <form className={styles.searchForm} action={`/pods/${podId}/activity`} method="get" role="search">
          {mine ? <input name="scope" type="hidden" value="mine" /> : null}
          <label htmlFor="proof-member-query">Search proofs by member</label>
          <input
            autoComplete="off"
            defaultValue={query}
            id="proof-member-query"
            name="q"
            placeholder="Name or @handle"
            type="search"
          />
        </form>
      </section>

      {feed.items.length > 0 ? (
        <section className={styles.proofList} aria-label="Submitted proofs">
          {feed.items.map((item) => {
            const {
              submission,
              commitment,
              occurrence,
              participant,
              templateId,
              isViewer,
              sharedEvidenceAvailable
            } = item;
            const presentation = presentTemplateEvidence({
              templateId,
              frozenConfig: {},
              commitment,
              templateEvidence: submission.templateEvidence,
              ...(submission.resultSummary !== null
                ? {
                    legacySubmission: {
                      resultSummary: submission.resultSummary,
                      artifactUrl: submission.artifactUrl ?? ""
                    }
                  }
                : {})
            });
            return (
              <article className={styles.proofCard} data-proof-history-entry key={submission.id}>
              <header className={styles.proofHeader}>
                <Link className={styles.participant} href={`/u/${participant.handle}`}>
                  <ProfileAvatar avatar={participant.avatar} displayName={participant.displayName} size="small" />
                  <span><strong>{participant.displayName}{isViewer ? " (you)" : ""}</strong><small>@{participant.handle}</small></span>
                </Link>
                <span className={styles.proofStatus} data-state={submission.state}>{proofStateLabel(submission.state)}</span>
              </header>
              <div className={styles.proofMeta}>
                <span>Occurrence {occurrence.ordinal}</span>
                <time dateTime={submission.submittedAt?.toISOString()}>{submission.submittedAt ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(submission.submittedAt) : occurrence.localDate}</time>
              </div>
              {sharedEvidenceAvailable ? (
                <a className={styles.proofImage} href={`/api/pods/${podId}/submissions/${submission.id}/shared-evidence`} rel="noreferrer" target="_blank">
                  <Image
                    alt={`Pod-shared proof from ${participant.displayName}`}
                    fill
                    sizes="(max-width: 520px) 100vw, 480px"
                    src={`/api/pods/${podId}/submissions/${submission.id}/shared-evidence`}
                    unoptimized
                  />
                </a>
              ) : null}
              <div className={styles.proofCopy}>
                <span>{presentation.templateName}</span>
                <h2>{commitment.task}</h2>
                {presentation.evidenceRows.length > 0 ? (
                  <div className={styles.proofRows}>
                    {presentation.evidenceRows.map((row) => (
                      <p key={row.label}><strong>{row.label}</strong>{row.value}</p>
                    ))}
                  </div>
                ) : (
                  <p>Proof details were kept private by this participant.</p>
                )}
                {presentation.artifact ? (
                  <ArtifactLinkCard
                    context="Public artifact"
                    href={presentation.artifact.href}
                    label={presentation.artifact.label}
                  />
                ) : null}
              </div>
            </article>
            );
          })}
        </section>
      ) : (
        <section className={styles.empty}>
          <strong>No submitted proofs found</strong>
          <p>Try another member or scope.</p>
        </section>
      )}

      {page > 1 || feed.hasNext ? (
        <nav className={styles.pagination} aria-label="Proof pages">
          {page > 1 ? <Link href={pageHref(podId, { query, mine, page: page - 1 })}>Previous</Link> : <span />}
          <span>Page {page}</span>
          {feed.hasNext ? <Link href={pageHref(podId, { query, mine, page: page + 1 })}>Next</Link> : <span />}
        </nav>
      ) : null}
    </main>
  );
}
