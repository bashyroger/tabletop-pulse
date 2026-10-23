"use client";

import Link from "next/link";
import { Award, Crown, Medal, Trophy } from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-table/data-table";
import type { PlayerLeaderboardItem } from "@/lib/boardgames/types";

interface PlayersClientProps {
  players: PlayerLeaderboardItem[];
}

export function PlayersClient({ players }: PlayersClientProps) {
  const columns: DataTableColumn<PlayerLeaderboardItem>[] = [
    {
      key: "rank",
      header: "Rank",
      align: "center",
      render: (_, idx) => (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] font-mono text-xs font-bold text-[#F4F0E8] tabular-nums">
          #{idx + 1}
        </span>
      ),
    },
    {
      key: "display_name",
      header: "Player (Meeple)",
      sortable: true,
      sortValue: (p) => p.display_name,
      render: (p) => (
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-[#0B0C10]"
            style={{ backgroundColor: p.avatar_color }}
          >
            {p.display_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <Link
              href={`/players/${p.slug}`}
              className="text-xs font-bold text-[#F4F0E8] hover:text-[#A48DFF]"
            >
              {p.display_name}
            </Link>
            <p className="font-mono text-[11px] text-[#9CA3AF]">
              {p.handle} • {p.favorite_category}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "elo_rating",
      header: "ELO Rating",
      align: "right",
      sortable: true,
      sortValue: (p) => p.elo_rating,
      render: (p) => (
        <div className="font-mono tabular-nums">
          <span className="text-sm font-bold text-[#A48DFF]">
            {p.elo_rating}
          </span>
          <span
            className={`ml-2 rounded px-1.5 py-0.5 text-[10px] ${
              p.elo_delta_total >= 0
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-rose-500/15 text-rose-300"
            }`}
          >
            {p.elo_delta_total >= 0
              ? `+${p.elo_delta_total}`
              : p.elo_delta_total}
          </span>
        </div>
      ),
    },
    {
      key: "win_rate",
      header: "Win Rate",
      align: "right",
      sortable: true,
      sortValue: (p) => Number(p.win_rate),
      render: (p) => (
        <span className="font-mono text-xs font-bold text-emerald-300 tabular-nums">
          {p.win_rate}% ({p.wins_count}/{p.games_played})
        </span>
      ),
    },
    {
      key: "podium_rate",
      header: "Podium Rate",
      align: "right",
      sortable: true,
      sortValue: (p) => Number(p.podium_rate),
      render: (p) => (
        <span className="font-mono text-xs text-[#F4F0E8] tabular-nums">
          {p.podium_rate}% (Avg #{p.avg_placement})
        </span>
      ),
    },
    {
      key: "player_h_index",
      header: "H-Index",
      align: "right",
      sortable: true,
      sortValue: (p) => p.player_h_index,
      render: (p) => (
        <span className="font-mono text-xs font-bold text-amber-300 tabular-nums">
          H-{p.player_h_index}
        </span>
      ),
    },
    {
      key: "signature_game_title",
      header: "Signature Game",
      render: (p) => (
        <span className="text-xs font-medium text-[#E5E7EB]">
          {p.signature_game_title}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Podium Top 3 Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {players.slice(0, 3).map((player, idx) => {
          const isFirst = idx === 0;
          return (
            <Link
              key={player.id}
              href={`/players/${player.slug}`}
              className={`group rounded-2xl border p-5 transition hover:-translate-y-0.5 ${
                isFirst
                  ? "border-amber-400/35 bg-gradient-to-br from-amber-500/12 via-[#13151C] to-[#13151C]"
                  : "border-white/[0.08] bg-[#13151C] hover:border-[#A48DFF]/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold ${
                    isFirst
                      ? "bg-amber-400 text-[#0B0C10]"
                      : "bg-white/[0.08] text-[#F4F0E8]"
                  }`}
                >
                  {idx === 0 ? (
                    <Crown className="h-3.5 w-3.5" />
                  ) : idx === 1 ? (
                    <Medal className="h-3.5 w-3.5 text-slate-300" />
                  ) : (
                    <Award className="h-3.5 w-3.5 text-amber-600" />
                  )}
                  Rank #{idx + 1}
                </span>

                <span className="font-mono text-xl font-bold text-[#A48DFF] tabular-nums">
                  {player.elo_rating} ELO
                </span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black text-[#0B0C10]"
                  style={{ backgroundColor: player.avatar_color }}
                >
                  {player.display_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F4F0E8] group-hover:text-[#A48DFF]">
                    {player.display_name}
                  </h3>
                  <p className="font-mono text-xs text-[#9CA3AF]">
                    {player.handle}
                  </p>
                </div>
              </div>

              <p className="mt-3 line-clamp-2 text-xs text-[#9CA3AF]">
                {player.tagline}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3 text-center font-mono text-xs tabular-nums">
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase">Wins</p>
                  <p className="mt-0.5 font-bold text-emerald-300">
                    {player.win_rate}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase">Podium</p>
                  <p className="mt-0.5 font-bold text-[#F4F0E8]">
                    {player.podium_rate}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase">Hours</p>
                  <p className="mt-0.5 font-bold text-[#A48DFF]">
                    {player.total_hours}h
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-[#0E1017] px-3 py-2 text-xs">
                <span className="text-[#9CA3AF]">Signature Game</span>
                <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                  <Trophy className="h-3 w-3" />
                  {player.signature_game_title}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Full Leaderboard Table */}
      <DataTable
        data={players}
        columns={columns}
        rowKey={(p) => p.id}
        searchPlaceholder="Search players by name, handle, or signature game..."
        searchMatcher={(p, q) =>
          p.display_name.toLowerCase().includes(q) ||
          p.handle.toLowerCase().includes(q) ||
          p.signature_game_title.toLowerCase().includes(q)
        }
      />
    </div>
  );
}
