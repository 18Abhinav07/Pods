import Link from "next/link";

import styles from "../../../components/ops-flow.module.css";
import { ReportProfileForm } from "../../../components/report-profile-form";
import { requireSession } from "../../../lib/session";

export default async function ReportProfilePage({
  params
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  await requireSession(`/report/${handle}`);
  return (
    <main className={`${styles.shell} ${styles.reportShell}`}>
      <header className={styles.topbar}>
        <Link
          className={`wordmark ${styles.wordmark}`}
          href={`/u/${handle}`}
        >
          <span className="pod-mark" aria-hidden="true" />
          pods
        </Link>
        <span className={styles.contextPill}>Private report</span>
      </header>
      <section className={styles.reportIntro}>
        <span>Safety</span>
        <h1>Report @{handle}</h1>
        <p>
          Reports go to Pods operations. The reported person is not notified
          by this form.
        </p>
      </section>
      <ReportProfileForm handle={handle} />
    </main>
  );
}
