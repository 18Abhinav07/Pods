import { NextResponse } from "next/server";

import { privateEvidenceStorage } from "../../../../lib/evidence-storage";
import { checkWebReadiness } from "../../../../lib/health";
import { podsRepository } from "../../../../lib/server-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await checkWebReadiness({
    database: () => podsRepository.checkHealth(),
    evidenceStorage: () => privateEvidenceStorage().assertReady()
  });

  return NextResponse.json(
    {
      service: "pods-web",
      status: result.ready ? "ready" : "not_ready",
      checks: result.checks,
      ...(result.ready && result.runtime ? { runtime: result.runtime } : {})
    },
    { status: result.ready ? 200 : 503 }
  );
}
