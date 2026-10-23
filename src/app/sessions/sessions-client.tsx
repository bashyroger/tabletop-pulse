"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SessionCard } from "@/components/boardgames/session-card";
import type {
  BoardGameCatalogItem,
  PlayerLeaderboardItem,
  PlaySessionFeedItem,
} from "@/lib/boardgames/types";

interface SessionsClientProps {
  sessions: PlaySessionFeedItem[];
  games: BoardGameCatalogItem[];
  players: PlayerLeaderboardItem[];
  initialGameFilter?: string;
  initialPlayerFilter?: string;
}

export function SessionsClient({
  sessions,
  games,
  players,
  initialGameFilter = "all",
  initialPlayerFilter = "all",
}: SessionsClientProps) {
  const [query, setQuery] = useState("");
  const [gameFilter, setGameFilter] = useState(initialGameFilter);
  const [playerFilter, setPlayerFilter] = useState(initialPlayerFilter);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions.filter((s) => {
      if (gameFilter !== "all" && s.game.slug !== gameFilter) {
        return false;
      }
      if (
        playerFilter !== "all" &&
        !s.results.some((r) => r.player_slug === playerFilter)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        s.session_title.toLowerCase().includes(q) ||
        s.game.title.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.highlight_moment.toLowerCase().includes(q) ||
        s.results.some((r) => r.player_name.toLowerCase().includes(q))
      );
    });
  }, [sessions, query, gameFilter, playerFilter]);

  const totalHours = useMemo(
    () =>
      (
        filtered.reduce((acc, s) => acc + s.duration_minutes, 0) / 60
      ).toFixed(1),
    [filtered]
  );

  return (
    <div className="space-y-5">
      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#13151C] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, players, highlights..."
              className="h-9 border-white/[0.1] bg-[#0E1017] pl-9 text-xs text-[#F4F0E8]"
            />
          </div>

          <select
            aria-label="Filter by board game"
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="h-9 rounded-lg border border-white/[0.1] bg-[#0E1017] px-3 text-xs text-[#F4F0E8]"
          >
            <option value="all">All Board Games ({games.length})</option>
            {games.map((g) => (
              <option key={g.id} value={g.slug}>
                {g.title}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by player"
            value={playerFilter}
            onChange={(e) => setPlayerFilter(e.target.value)}
            className="h-9 rounded-lg border border-white/[0.1] bg-[#0E1017] px-3 text-xs text-[#F4F0E8]"
          >
            <option value="all">All Players ({players.length})</option>
            {players.map((p) => (
              <option key={p.id} value={p.slug}>
                {p.display_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-[#9CA3AF] tabular-nums">
          <span>{filtered.length} Matches</span>
          <span>•</span>
          <span className="text-[#A48DFF]">{totalHours} Table Hours</span>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#13151C] p-12 text-center text-sm text-[#9CA3AF]">
            No play sessions match your current filter.
          </div>
        ) : (
          filtered.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))
        )}
      </div>
    </div>
  );
}
