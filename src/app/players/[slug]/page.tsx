import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Crown,
  Hash,
  Share2,
  Swords,
  Trophy,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SessionCard } from "@/components/boardgames/session-card";
import {
  getPlayersLeaderboard,
  getSessionsFeed,
} from "@/lib/boardgames/queries";

export const dynamic = "force-dynamic";

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [players, sessions] = await Promise.all([
    getPlayersLeaderboard(),
    getSessionsFeed({ playerSlug: slug, limit: 25 }),
  ]);

  const player = players.find((p) => p.slug === slug);
  if (!player) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/players"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9CA3AF] hover:text-[#F4F0E8]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to ELO Leaderboard
        </Link>
      </div>

      <PageHeader
        badge={`${player.handle} • ${player.favorite_category} Specialist`}
        title={player.display_name}
        subtitle={player.tagline}
        actions={
          <>
            <Link
              href="/rivalries"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#13151C] px-3.5 py-2 text-xs font-medium text-[#F4F0E8] hover:border-[#A48DFF]/40"
            >
              <Swords className="h-3.5 w-3.5 text-[#FF6B6B]" />
              Compare Rivalry
            </Link>
            <Link
              href="/share-studio"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#A48DFF] px-3.5 py-2 text-xs font-semibold text-[#0B0C10] hover:bg-[#B8A5FF]"
            >
              <Share2 className="h-3.5 w-3.5" />
              Mint Spotlight Card
            </Link>
          </>
        }
      />

      {/* Trophy Room KPIs */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-5">
        <div className="rounded-2xl border border-[#A48DFF]/30 bg-[#13151C] p-4 tabular-nums">
          <p className="text-xs text-[#9CA3AF]">Club ELO Rating</p>
          <p className="mt-2 flex items-center gap-1.5 font-mono text-2xl font-bold text-[#A48DFF]">
            <Crown className="h-5 w-5" />
            {player.elo_rating}
          </p>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">
            Net {player.elo_delta_total >= 0 ? `+${player.elo_delta_total}` : player.elo_delta_total}{" "}
            season ELO
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-400/25 bg-[#13151C] p-4 tabular-nums">
          <p className="text-xs text-[#9CA3AF]">Win Rate</p>
          <p className="mt-2 flex items-center gap-1.5 font-mono text-2xl font-bold text-emerald-300">
            <Trophy className="h-5 w-5" />
            {player.win_rate}%
          </p>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">
            {player.wins_count} Wins / {player.games_played} Matches
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#13151C] p-4 tabular-nums">
          <p className="text-xs text-[#9CA3AF]">Podium Rate</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#F4F0E8]">
            {player.podium_rate}%
          </p>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">
            Avg finish #{player.avg_placement}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-400/25 bg-[#13151C] p-4 tabular-nums">
          <p className="text-xs text-[#9CA3AF]">Personal H-Index</p>
          <p className="mt-2 flex items-center gap-1.5 font-mono text-2xl font-bold text-amber-300">
            <Hash className="h-5 w-5" />
            {player.player_h_index}
          </p>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">
            Signature: {player.signature_game_title}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#13151C] p-4 tabular-nums">
          <p className="text-xs text-[#9CA3AF]">Table Hours</p>
          <p className="mt-2 flex items-center gap-1.5 font-mono text-2xl font-bold text-[#F4F0E8]">
            <Clock className="h-5 w-5 text-[#5F8F8B]" />
            {player.total_hours}h
          </p>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">
            Peak Score: {player.best_score} VP
          </p>
        </div>
      </div>

      {/* Player Match History */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#F4F0E8]">
          Match Chronicle for {player.display_name} ({sessions.length})
        </h2>
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
}
