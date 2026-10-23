"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Share2, Swords, Trophy } from "lucide-react";
import { toast } from "sonner";
import { createShareCardAction } from "@/app/actions/boardgames";
import type {
  HeadToHeadData,
  PlayerLeaderboardItem,
} from "@/lib/boardgames/types";

interface RivalryAnalyzerClientProps {
  players: PlayerLeaderboardItem[];
  playerA: PlayerLeaderboardItem;
  playerB: PlayerLeaderboardItem;
  h2hData: HeadToHeadData;
}

export function RivalryAnalyzerClient({
  players,
  playerA,
  playerB,
  h2hData,
}: RivalryAnalyzerClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { summary, by_game } = h2hData;

  function handleSelectPlayers(nextA: string, nextB: string) {
    router.push(`/rivalries?a=${nextA}&b=${nextB}`);
  }

  function handleMintRivalryCard() {
    startTransition(async () => {
      const res = await createShareCardAction({
        card_type: "rivalry_head_to_head",
        title: `${playerA.display_name} vs. ${playerB.display_name}`,
        subtitle: `${summary.shared_sessions_count} Shared Matches • ${summary.player_a_better_finishes} - ${summary.player_b_better_finishes} Head-to-Head Finishes`,
        theme_preset: "crimson-meeple",
        player_id: playerA.id,
        snapshot_payload: {
          player_a: `${playerA.display_name} (${playerA.elo_rating} ELO)`,
          player_b: `${playerB.display_name} (${playerB.elo_rating} ELO)`,
          shared_matches: summary.shared_sessions_count,
          scoreline: `${summary.player_a_better_finishes} - ${summary.player_b_better_finishes} Finishes`,
          avg_placement: `#${summary.player_a_avg_placement} vs #${summary.player_b_avg_placement}`,
          top_battleground: by_game[0]?.game_title ?? "Heavy Euro Nights",
        },
      });

      if (!res.success || !res.data) {
        toast.error(res.error ?? "Failed to create rivalry card");
        return;
      }

      toast.success("Minted public Rivalry Stat Card!");
      router.push(`/share/${res.data.share_code}`);
    });
  }

  return (
    <div className="space-y-6">
      {/* Selector Bar */}
      <div className="grid gap-4 rounded-2xl border border-white/[0.08] bg-[#13151C] p-5 sm:grid-cols-11 sm:items-center">
        <div className="space-y-1.5 sm:col-span-4">
          <label className="text-[11px] font-semibold tracking-wider text-[#A48DFF] uppercase">
            Challenger A
          </label>
          <select
            aria-label="Select Challenger A"
            value={playerA.slug}
            onChange={(e) => handleSelectPlayers(e.target.value, playerB.slug)}
            className="flex h-10 w-full rounded-xl border border-white/[0.1] bg-[#0E1017] px-3 text-xs font-semibold text-[#F4F0E8]"
          >
            {players.map((p) => (
              <option key={p.id} value={p.slug}>
                {p.display_name} ({p.elo_rating} ELO)
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col items-center justify-center sm:col-span-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#FF6B6B]/40 bg-[#FF6B6B]/15 text-[#FF6B6B]">
            <Swords className="h-5 w-5" />
          </div>
          <span className="mt-1 font-mono text-[10px] tracking-widest text-[#9CA3AF] uppercase">
            {summary.shared_sessions_count} Shared Tables
          </span>
        </div>

        <div className="space-y-1.5 sm:col-span-4">
          <label className="text-[11px] font-semibold tracking-wider text-[#FF6B6B] uppercase">
            Challenger B
          </label>
          <select
            aria-label="Select Challenger B"
            value={playerB.slug}
            onChange={(e) => handleSelectPlayers(playerA.slug, e.target.value)}
            className="flex h-10 w-full rounded-xl border border-white/[0.1] bg-[#0E1017] px-3 text-xs font-semibold text-[#F4F0E8]"
          >
            {players.map((p) => (
              <option key={p.id} value={p.slug}>
                {p.display_name} ({p.elo_rating} ELO)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Head-to-Head Scoreboard */}
      <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#171625] via-[#13151C] to-[#21151B] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#F4F0E8]">
              {playerA.display_name} vs. {playerB.display_name}
            </h2>
            <p className="text-xs text-[#9CA3AF]">
              Direct head-to-head placement & victory comparison across{" "}
              {summary.shared_sessions_count} shared play sessions
            </p>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={handleMintRivalryCard}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B6B] px-4 py-2 text-xs font-semibold text-[#0B0C10] transition hover:bg-[#FF8585] disabled:opacity-50"
          >
            <Share2 className="h-4 w-4" />
            {isPending ? "Minting Card..." : "Mint Shareable Rivalry Card"}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 tabular-nums">
          <div className="rounded-2xl border border-[#A48DFF]/25 bg-[#0E1017] p-4">
            <p className="text-[11px] text-[#9CA3AF]">
              {playerA.display_name} Outplaced
            </p>
            <p className="mt-2 font-mono text-3xl font-bold text-[#A48DFF]">
              {summary.player_a_better_finishes}
            </p>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              {summary.player_a_wins} Table Wins • Avg #
              {summary.player_a_avg_placement}
            </p>
          </div>

          <div className="rounded-2xl border border-[#FF6B6B]/25 bg-[#0E1017] p-4">
            <p className="text-[11px] text-[#9CA3AF]">
              {playerB.display_name} Outplaced
            </p>
            <p className="mt-2 font-mono text-3xl font-bold text-[#FF6B6B]">
              {summary.player_b_better_finishes}
            </p>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              {summary.player_b_wins} Table Wins • Avg #
              {summary.player_b_avg_placement}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0E1017] p-4">
            <p className="text-[11px] text-[#9CA3AF]">Average Score (VP)</p>
            <p className="mt-2 font-mono text-xl font-bold text-[#F4F0E8]">
              {summary.player_a_avg_score}{" "}
              <span className="text-xs text-[#9CA3AF]">vs</span>{" "}
              {summary.player_b_avg_score}
            </p>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              {summary.ties_count} tied placements (co-op)
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0E1017] p-4">
            <p className="text-[11px] text-[#9CA3AF]">Current ELO Gap</p>
            <p className="mt-2 font-mono text-2xl font-bold text-amber-300">
              {Math.abs(playerA.elo_rating - playerB.elo_rating)} pts
            </p>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              {playerA.elo_rating} vs {playerB.elo_rating} ELO
            </p>
          </div>
        </div>
      </div>

      {/* Per-Game Breakdown */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-[#F4F0E8]">
          Battleground Board Games ({by_game.length})
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {by_game.map((g) => (
            <div
              key={g.game_id}
              className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#13151C] p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-[#0B0C10]"
                  style={{ backgroundColor: g.cover_color }}
                >
                  {g.game_title.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <Link
                    href={`/games/${g.game_slug}`}
                    className="text-sm font-bold text-[#F4F0E8] hover:text-[#A48DFF]"
                  >
                    {g.game_title}
                  </Link>
                  <p className="text-xs text-[#9CA3AF]">
                    {g.shared_plays} shared plays • Avg {g.a_avg_score} vs{" "}
                    {g.b_avg_score} VP
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs font-bold tabular-nums">
                <span className="rounded-lg bg-[#A48DFF]/15 px-2.5 py-1 text-[#A48DFF]">
                  {g.a_outplaced_b}
                </span>
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                <span className="rounded-lg bg-[#FF6B6B]/15 px-2.5 py-1 text-[#FF6B6B]">
                  {g.b_outplaced_a}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
