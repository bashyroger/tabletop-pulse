import { PageHeader } from "@/components/layout/page-header";
import { ShareStudioClient } from "./share-studio-client";
import {
  getDashboardOverview,
  getGamesCatalog,
  getPlayersLeaderboard,
  getSharedStatCards,
} from "@/lib/boardgames/queries";

export const dynamic = "force-dynamic";

export default async function ShareStudioPage() {
  const [overview, games, players, cards] = await Promise.all([
    getDashboardOverview(),
    getGamesCatalog(),
    getPlayersLeaderboard(),
    getSharedStatCards(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Social Sharing & Public Link Studio"
        title="Shareable Stat Card Studio"
        subtitle="Design and mint public stat cards for your board game group — Season Wrapped, Player ELO Spotlights, Game Mastery Dossiers, and Head-to-Head Rivalries."
      />

      <ShareStudioClient
        overview={overview}
        games={games}
        players={players}
        existingCards={cards}
      />
    </div>
  );
}
