"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Crown,
  LayoutGrid,
  List,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data-table/data-table";
import type { BoardGameCatalogItem } from "@/lib/boardgames/types";

interface GamesClientProps {
  games: BoardGameCatalogItem[];
}

export function GamesClient({ games }: GamesClientProps) {
  const [view, setView] = useState<"grid" | "table">("grid");

  const columns: DataTableColumn<BoardGameCatalogItem>[] = [
    {
      key: "title",
      header: "Board Game",
      sortable: true,
      sortValue: (g) => g.title,
      render: (g) => (
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-[#0B0C10]"
            style={{ backgroundColor: g.cover_color }}
          >
            {g.title.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <Link
              href={`/games/${g.slug}`}
              className="text-xs font-bold text-[#F4F0E8] hover:text-[#A48DFF]"
            >
              {g.title}
            </Link>
            <p className="text-[11px] text-[#9CA3AF]">
              {g.designer} • {g.release_year}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Archetype",
      sortable: true,
      sortValue: (g) => g.category,
      render: (g) => (
        <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-[#E5E7EB]">
          {g.category}
        </span>
      ),
    },
    {
      key: "complexity_weight",
      header: "BGG Weight",
      align: "right",
      sortable: true,
      sortValue: (g) => Number(g.complexity_weight),
      render: (g) => (
        <span className="font-mono text-xs font-semibold text-[#A48DFF] tabular-nums">
          {Number(g.complexity_weight).toFixed(2)} / 5
        </span>
      ),
    },
    {
      key: "plays_count",
      header: "Plays",
      align: "right",
      sortable: true,
      sortValue: (g) => g.plays_count,
      render: (g) => (
        <span className="font-mono text-xs font-bold text-[#F4F0E8] tabular-nums">
          {g.plays_count}× ({g.total_hours}h)
        </span>
      ),
    },
    {
      key: "reigning_champion_name",
      header: "Reigning Champion",
      render: (g) =>
        g.reigning_champion_name ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-300">
            <Crown className="h-3.5 w-3.5" />
            {g.reigning_champion_name} ({g.champion_wins}W)
          </span>
        ) : (
          <span className="text-xs text-[#6B7280]">Unclaimed</span>
        ),
    },
    {
      key: "high_score",
      header: "High Score Record",
      align: "right",
      sortable: true,
      sortValue: (g) => Number(g.high_score),
      render: (g) => (
        <div className="font-mono text-xs tabular-nums">
          <span className="font-bold text-emerald-300">{g.high_score} VP</span>
          {g.high_score_player_name ? (
            <span className="block text-[10px] text-[#9CA3AF]">
              {g.high_score_player_name}
            </span>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* View Switcher */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#9CA3AF]">
          Showing <span className="font-semibold text-[#F4F0E8]">{games.length}</span>{" "}
          board games in active club closet
        </p>

        <div className="inline-flex rounded-xl border border-white/[0.08] bg-[#13151C] p-1">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition ${
              view === "grid"
                ? "bg-[#A48DFF] text-[#0B0C10]"
                : "text-[#9CA3AF] hover:text-[#F4F0E8]"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Shelf Cards
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition ${
              view === "table"
                ? "bg-[#A48DFF] text-[#0B0C10]"
                : "text-[#9CA3AF] hover:text-[#F4F0E8]"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            Telemetry Table
          </button>
        </div>
      </div>

      {view === "table" ? (
        <DataTable
          data={games}
          columns={columns}
          rowKey={(g) => g.id}
          searchPlaceholder="Search games by title, designer, or category..."
          searchMatcher={(g, q) =>
            g.title.toLowerCase().includes(q) ||
            g.designer.toLowerCase().includes(q) ||
            g.category.toLowerCase().includes(q)
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.slug}`}
              className="group flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#13151C] p-5 transition hover:-translate-y-0.5 hover:border-[#A48DFF]/40"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-[#0B0C10] shadow-md"
                    style={{ backgroundColor: game.cover_color }}
                  >
                    {game.title.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {game.bgg_rank ? (
                      <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-amber-300 tabular-nums">
                        BGG #{game.bgg_rank}
                      </span>
                    ) : null}
                    <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 font-mono text-[10px] text-[#E5E7EB] tabular-nums">
                      Weight {Number(game.complexity_weight).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <span className="text-[11px] font-semibold tracking-wider text-[#A48DFF] uppercase">
                    {game.category}
                  </span>
                  <h3 className="mt-0.5 text-base font-bold text-[#F4F0E8] group-hover:text-[#A48DFF]">
                    {game.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-[#9CA3AF]">
                    {game.subtitle || `${game.designer} (${game.release_year})`}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#9CA3AF] tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-[#5F8F8B]" />
                    {game.min_players}–{game.max_players}p
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-[#A48DFF]" />
                    {game.min_playtime_minutes}–{game.max_playtime_minutes}m
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[#F4F0E8]">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    {game.plays_count} Plays ({game.total_hours}h)
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-3.5 text-xs tabular-nums">
                <div className="rounded-xl bg-[#0E1017] px-3 py-2">
                  <p className="text-[10px] text-[#9CA3AF] uppercase">
                    Champion
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 truncate font-semibold text-amber-300">
                    <Crown className="h-3 w-3 shrink-0" />
                    {game.reigning_champion_name ?? "Open"}
                  </p>
                </div>
                <div className="rounded-xl bg-[#0E1017] px-3 py-2">
                  <p className="text-[10px] text-[#9CA3AF] uppercase">
                    Record Score
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 truncate font-mono font-bold text-emerald-300">
                    <Trophy className="h-3 w-3 shrink-0" />
                    {game.high_score} VP
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
