import Link from "next/link";
import { Swords } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AddPlayerDialog } from "@/components/boardgames/add-player-dialog";
import { PlayersClient } from "./players-client";
import { getPlayersLeaderboard } from "@/lib/boardgames/queries";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const players = await getPlayersLeaderboard();

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Live ELO Ratings & Personal H-Index"
        title="Club ELO Leaderboard"
        subtitle="Player rankings, win rates, podium finish percentages, signature games, and personal H-indices calculated in PostgreSQL."
        actions={
          <>
            <Link
              href="/rivalries"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#13151C] px-3.5 py-2 text-xs font-medium text-[#F4F0E8] hover:border-[#A48DFF]/40"
            >
              <Swords className="h-4 w-4 text-[#FF6B6B]" />
              Head-to-Head Rivalries
            </Link>
            <AddPlayerDialog />
          </>
        }
      />

      <PlayersClient players={players} />
    </div>
  );
}
