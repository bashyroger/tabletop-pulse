/**
 * Public routes that do not require an authenticated session.
 * Note: TabletopPulse also supports public read showcase mode across the club
 * dashboard, games, players, rivalries, and share cards so guests and club links
 * work seamlessly out of the box.
 */
export const PUBLIC_EXACT_ROUTES = new Set<string>([
  "/",
  "/login",
  "/privacy",
  "/terms",
  "/sessions",
  "/games",
  "/players",
  "/rivalries",
  "/share-studio",
]);

export const PUBLIC_PREFIX_ROUTES: readonly string[] = [
  "/auth/",
  "/share/",
  "/games/",
  "/players/",
  "/api/health",
];

export function isPublicPathname(pathname: string): boolean {
  if (PUBLIC_EXACT_ROUTES.has(pathname)) {
    return true;
  }
  return PUBLIC_PREFIX_ROUTES.some((prefix) => pathname.startsWith(prefix));
}
