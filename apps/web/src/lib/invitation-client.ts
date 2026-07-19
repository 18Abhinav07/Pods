type Fetcher = (path: string, init?: RequestInit) => Promise<Response>;

async function responseError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: unknown };
    return typeof data.error === "string" ? data.error : fallback;
  } catch {
    return fallback;
  }
}

export async function createPrivateInvitation(podId: string, fetcher: Fetcher = fetch) {
  const response = await fetcher(`/api/pods/${podId}/invitations`, { method: "POST" });
  if (!response.ok) throw new Error(await responseError(response, "Invitation could not be created"));
  return response.json() as Promise<{ invitation: { id: string; expiresAt: string }; token: string }>;
}

export async function revokePrivateInvitation(
  podId: string,
  invitationId: string,
  fetcher: Fetcher = fetch
) {
  const response = await fetcher(`/api/pods/${podId}/invitations/${invitationId}`, { method: "DELETE" });
  if (!response.ok) throw new Error(await responseError(response, "Invitation could not be revoked"));
}

export async function acceptPrivateInvitation(token: string, fetcher: Fetcher = fetch) {
  const response = await fetcher(`/api/invitations/${token}/accept`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ acceptedFrozenContract: true })
  });
  if (!response.ok) throw new Error(await responseError(response, "This invitation is unavailable"));
  const data = (await response.json()) as { membership: { podId: string; state: string } };
  return data.membership;
}
