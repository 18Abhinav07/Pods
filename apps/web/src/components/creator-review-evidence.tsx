"use client";

import { useState } from "react";

export function CreatorReviewEvidence({
  podId,
  submissionId
}: {
  podId: string;
  submissionId: string;
}) {
  const [unavailable, setUnavailable] = useState(false);

  if (unavailable) {
    return (
      <div className="creator-review-evidence-unavailable" role="status">
        <strong>Evidence unavailable</strong>
        <p>
          The proof details remain available for review. Use the locked task,
          result summary, and public artifact to make your decision.
        </p>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt="Creator-only evidence"
      onError={() => setUnavailable(true)}
      src={`/api/pods/${podId}/admin/reviews/${submissionId}/evidence`}
    />
  );
}
