import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Crown,
  Share2,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LogSessionDialog } from "@/components/boardgames/log-session-dialog";
import { SessionCard } from "@/components/boardgames/session-card";
import {
  getGamesCatalog,
  getPlayersLeaderboard,
  getSessionsFeed,
} from "@/lib/boardgames/queries";

export const dynamic = "force-dynamic";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [games, players, sessions] = await Promise.all([
    getGamesCatalog(),
    getPlayersLeaderboard(),
    getSessionsFeed({ gameSlug: slug, limit: 25 }),
  ]);

  const game = games.find((g) => g.slug === slug);
  if (!game) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/games"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9CA3AF] hover:text-[#F4F0E8]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Board Game Closet
        </Link>
      </div>

      <PageHeader
        badge={`${game.category} • BGG Weight ${Number(game.complexity_weight).toFixed(2)}/5.00`}
        title={game.title}
        subtitle={`${game.subtitle} — Designed by ${game.designer} (${game.publisher}, ${game.release_year})`}
        actions={
          <>
            <Link
              href="/share-studio"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#13151C] px-3.5 py-2 text-xs font-medium text-[#F4F0E8] hover:border-[#A48DFF]/40"
            >
              <Share2 className="h-3.5 w-3.5 text-[#A48DFF]" />
              Share Mastery Card
            </Link>
            <LogSessionDialog
              games={games}
              players={players}
              defaultGameId={game.id}
            />
          </>
        }
      />

      {/* Game KPIs */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/[0.08] bg-[#13151C] p-4 tabular-nums">
          <p className="text-xs text-[#9CA3AF]">Club Plays & Hours</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#F4F0E8]">
            {game.plays_count}×{" "}
            <span className="text-sm font-normal text-[#A48DFF]">
              ({game.total_hours}h)
            </span>
          </p>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-[#9CA3AF]">
            <Clock className="h-3 w-3" /> Avg {game.avg_duration_minutes} min
          </p>
        </div>

        <div className="rounded-2xl border border-amber-400/25 bg-[#13151C] p-4 tabular-nums">
          <p className="text-xs text-[#9CA3AF]">Reigning Club Champion</p>
          <p className="mt-2 flex items-center gap-1.5 text-lg font-bold text-amber-300">
            <Crown className="h-4 w-4 shrink-0" />
            {game.reigning_champion_name ?? "Unclaimed"}
          </p>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">
            {game.champion_wins} Table Victories
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-400/25 bg-[#13151C] p-4 tabular-nums">
          <p className="text-xs text-[#9CA3AF]">All-Time High Score</p>
          <p className="mt-2 flex items-center gap-1.5 font-mono text-2xl font-bold text-emerald-300">
            <Trophy className="h-4 w-4 shrink-0" />
            {game.high_score} VP
          </p>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">
            Held by {game.high_score_player_name ?? "Club Member"} (Avg{" "}
            {game.avg_score} VP)
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#13151C] p-4 tabular-nums">
          <p className="text-xs text-[#9CA3AF]">Box Specifications</p>
          <p className="mt-2 flex items-center gap-1.5 font-mono text-xl font-bold text-[#F4F0E8]">
            <Users className="h-4 w-4 text-[#5F8F8B]" />
            {game.min_players}–{game.max_players} Players
          </p>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-[#9CA3AF]">
            <Sparkles className="h-3 w-3 text-[#A48DFF]" />
            {game.unique_players_count} club members have played
          </p>
        </div>
      </div>

      {/* Logged Sessions for this Game */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#F4F0E8]">
          Logged Play Sessions for {game.title} ({sessions.length})
        </h2>
        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#13151C] p-10 text-center text-sm text-[#9CA3AF]">
            No sessions logged for {game.title} yet. Click{" "}
            <strong className="text-[#F4F0E8]">Log Table Match</strong> above to
            record your first play!
          </div>
        ) : (
          sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))
        )}
      </div>
    </div>
  );
}
