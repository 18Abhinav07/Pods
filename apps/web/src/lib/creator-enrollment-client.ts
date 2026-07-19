import type { ApplicationDecision } from "@pods/domain";

type Fetcher = (path: string, init?: RequestInit) => Promise<Response>;

async function command<T>(path: string, init: RequestInit, fetcher: Fetcher, fallback: string) {
  const response = await fetcher(path, init);
  const data = (await response.json()) as { error?: unknown } & T;
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : fallback);
  }
  return data;
}

export async function decidePodApplication(
  podId: string,
  applicationId: string,
  decision: ApplicationDecision,
  fetcher: Fetcher = fetch
) {
  const data = await command<{ application: { state: string } }>(
    `/api/pods/${podId}/applications/${applicationId}`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision })
    },
    fetcher,
    "Application decision could not be saved"
  );
  return data.application;
}

export async function cancelEnrollmentPod(podId: string, fetcher: Fetcher = fetch) {
  const data = await command<{ pod: { state: string } }>(
    `/api/pods/${podId}/cancel`,
    { method: "POST" },
    fetcher,
    "Pod could not be cancelled"
  );
  return data.pod;
}
