const STALE_DEPLOY_RELOAD_KEY = "tabletop_pulse:stale-deploy-reload";

export function isStaleServerActionError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === "string"
        ? error
        : "";

  if (!message) return false;

  return (
    /Failed to find Server Action/i.test(message) ||
    /ChunkLoadError/i.test(message) ||
    /Loading chunk [\w-]+ failed/i.test(message) ||
    (/Failed to fetch/i.test(message) && /next-action|rsc/i.test(message))
  );
}

export function recoverFromStaleDeployment(error: unknown): boolean {
  if (typeof window === "undefined" || !isStaleServerActionError(error)) {
    return false;
  }

  try {
    const lastReload = Number(
      window.sessionStorage.getItem(STALE_DEPLOY_RELOAD_KEY) ?? "0"
    );
    const now = Date.now();
    if (now - lastReload < 15_000) {
      return false;
    }
    window.sessionStorage.setItem(STALE_DEPLOY_RELOAD_KEY, String(now));
  } catch {
    // Ignore storage errors
  }

  window.location.reload();
  return true;
}
