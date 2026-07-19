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
  fetcher: Fetcher = fetch
) {
  const response = await fetcher(`/api/pods/${podId}/applications`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ answers })
  });
  if (!response.ok) throw new Error(await errorMessage(response, "Application could not be sent"));
  const data = (await response.json()) as { application: { id: string; state: string } };
  return data.application;
}
