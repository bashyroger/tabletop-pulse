import { PageHeader } from "@/components/layout/page-header";
import { LogSessionDialog } from "@/components/boardgames/log-session-dialog";
import { SessionsClient } from "./sessions-client";
import {
  getGamesCatalog,
  getPlayersLeaderboard,
  getSessionsFeed,
} from "@/lib/boardgames/queries";

export const dynamic = "force-dynamic";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ log?: string; game?: string; player?: string }>;
}) {
  const params = await searchParams;
  const [sessions, games, players] = await Promise.all([
    getSessionsFeed({ limit: 50 }),
    getGamesCatalog(),
    getPlayersLeaderboard(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Chronological Match Chronicle"
        title="Match Log & Table Nights"
        subtitle="Filter every play session by board game, player, or cooperative outcome. Every logged match recalculates club ELO and mints a shareable recap card."
        actions={
          <LogSessionDialog
            games={games}
            players={players}
            defaultOpen={params.log === "1"}
          />
        }
      />

      <SessionsClient
        sessions={sessions}
        games={games}
        players={players}
        initialGameFilter={params.game ?? "all"}
        initialPlayerFilter={params.player ?? "all"}
      />
    </div>
  );
}
