import { PageHeader } from "@/components/layout/page-header";
import { AddGameDialog } from "@/components/boardgames/add-game-dialog";
import { LogSessionDialog } from "@/components/boardgames/log-session-dialog";
import { GamesClient } from "./games-client";
import {
  getGamesCatalog,
  getPlayersLeaderboard,
} from "@/lib/boardgames/queries";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const [games, players] = await Promise.all([
    getGamesCatalog(),
    getPlayersLeaderboard(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Club Shelf & Complexity Telemetry"
        title="Board Game Closet"
        subtitle="Explore your club's collection with BGG complexity weights, reigning champions, high-score records, and total table hours."
        actions={
          <>
            <LogSessionDialog games={games} players={players} />
            <AddGameDialog />
          </>
        }
      />

      <GamesClient games={games} />
    </div>
  );
}
