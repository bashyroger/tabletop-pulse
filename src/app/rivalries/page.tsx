import { PageHeader } from "@/components/layout/page-header";
import { RivalryAnalyzerClient } from "./rivalry-analyzer-client";
import {
  getHeadToHeadRivalry,
  getPlayersLeaderboard,
} from "@/lib/boardgames/queries";

export const dynamic = "force-dynamic";

export default async function RivalriesPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const params = await searchParams;
  const players = await getPlayersLeaderboard();

  const playerA =
    players.find((p) => p.id === params.a || p.slug === params.a) ??
    players[0];
  const playerB =
    players.find((p) => p.id === params.b || p.slug === params.b) ??
    players[1] ??
    players[0];

  const h2hData =
    playerA && playerB
      ? await getHeadToHeadRivalry(playerA.id, playerB.id)
      : {
          summary: {
            shared_sessions_count: 0,
            player_a_wins: 0,
            player_b_wins: 0,
            player_a_better_finishes: 0,
            player_b_better_finishes: 0,
            ties_count: 0,
            player_a_avg_placement: 0,
            player_b_avg_placement: 0,
            player_a_avg_score: 0,
            player_b_avg_score: 0,
          },
          by_game: [],
        };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="PostgreSQL Head-to-Head Engine"
        title="Rivalry Analyzer (H2H)"
        subtitle="Select any two club members to compare shared matches, outplacement ratios, average VP differentials, and battleground board games."
      />

      {playerA && playerB ? (
        <RivalryAnalyzerClient
          players={players}
          playerA={playerA}
          playerB={playerB}
          h2hData={h2hData}
        />
      ) : null}
    </div>
  );
}
