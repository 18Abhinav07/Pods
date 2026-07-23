type Fetcher = (path: string, init?: RequestInit) => Promise<Response>;

async function errorMessage(response: Response, fallback: string) {
  const data = (await response.json()) as { error?: unknown; errors?: unknown };
  if (Array.isArray(data.errors)) {
    const errors = data.errors.filter((item): item is string => typeof item === "string");
    if (errors.length > 0) return errors.join(". ");
  }
  return typeof data.error === "string" ? data.error : fallback;
}

export async function submitPublicApplication(
  podId: string,
  answers: string[],
  consentOrFetcher:
    | Fetcher
    | {
        acceptedContractHash: string;
        visitorDisclosureAccepted: true;
      } = fetch,
  explicitFetcher: Fetcher = fetch
) {
  const consent =
    typeof consentOrFetcher === "function" ? null : consentOrFetcher;
  const fetcher =
    typeof consentOrFetcher === "function" ? consentOrFetcher : explicitFetcher;
  const response = await fetcher(`/api/pods/${podId}/applications`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ answers, ...(consent ?? {}) })
  });
  if (!response.ok) throw new Error(await errorMessage(response, "Application could not be sent"));
  const data = (await response.json()) as { application: { id: string; state: string } };
  return data.application;
}
