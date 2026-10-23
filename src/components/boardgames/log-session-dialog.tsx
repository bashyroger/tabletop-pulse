"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, PlusCircle, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { logSessionAction } from "@/app/actions/boardgames";
import type {
  BoardGameCatalogItem,
  PlayerLeaderboardItem,
} from "@/lib/boardgames/types";

interface LogSessionDialogProps {
  games: BoardGameCatalogItem[];
  players: PlayerLeaderboardItem[];
  defaultOpen?: boolean;
  defaultGameId?: string;
}

interface PlayerRowState {
  player_id: string;
  score: number;
  faction_or_role: string;
  is_new_player: boolean;
}

export function LogSessionDialog({
  games,
  players,
  defaultOpen = false,
  defaultGameId,
}: LogSessionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [isPending, startTransition] = useTransition();

  const [boardGameId, setBoardGameId] = useState(
    defaultGameId ?? games[0]?.id ?? ""
  );
  const [sessionTitle, setSessionTitle] = useState("");
  const [location, setLocation] = useState("Jordaan Boardroom");
  const [durationMinutes, setDurationMinutes] = useState(95);
  const [highlightMoment, setHighlightMoment] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [isFirstPlay, setIsFirstPlay] = useState(false);

  const [rows, setRows] = useState<PlayerRowState[]>(() =>
    players.slice(0, 3).map((p, idx) => ({
      player_id: p.id,
      score: 120 - idx * 12,
      faction_or_role: "",
      is_new_player: false,
    }))
  );

  function addPlayerRow() {
    const usedIds = new Set(rows.map((r) => r.player_id));
    const available = players.find((p) => !usedIds.has(p.id)) ?? players[0];
    if (!available) return;
    setRows((prev) => [
      ...prev,
      {
        player_id: available.id,
        score: 80,
        faction_or_role: "",
        is_new_player: false,
      },
    ]);
  }

  function removePlayerRow(idx: number) {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateRow(idx: number, patch: Partial<PlayerRowState>) {
    setRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const selectedGame = games.find((g) => g.id === boardGameId);
    const computedTitle =
      sessionTitle.trim() ||
      `${selectedGame?.title ?? "Board Game"} Table Night`;

    startTransition(async () => {
      const res = await logSessionAction({
        board_game_id: boardGameId,
        duration_minutes: Number(durationMinutes) || 90,
        location: location.trim() || "Home Table",
        session_title: computedTitle,
        session_notes: sessionNotes.trim(),
        highlight_moment: highlightMoment.trim(),
        is_first_play: isFirstPlay,
        results: rows.map((r) => ({
          player_id: r.player_id,
          score: Number(r.score) || 0,
          faction_or_role: r.faction_or_role.trim(),
          is_new_player: r.is_new_player,
        })),
      });

      if (!res.success) {
        toast.error(res.error ?? "Failed to log play session");
        return;
      }

      toast.success(
        "Match logged! ELO ratings & shareable stat card generated."
      );
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          data-testid="open-log-session-dialog"
          className="inline-flex items-center gap-2 rounded-xl bg-[#A48DFF] px-4 py-2 text-xs font-semibold text-[#0B0C10] shadow-[0_0_20px_rgba(164,141,255,0.3)] transition hover:bg-[#B8A5FF]"
        >
          <PlusCircle className="h-4 w-4" />
          Log Table Match
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/[0.12] bg-[#13151C] text-[#F4F0E8] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[#F4F0E8]">
            <Sparkles className="h-5 w-5 text-[#A48DFF]" />
            Log Multi-Player Board Game Match
          </DialogTitle>
          <DialogDescription className="text-xs text-[#9CA3AF]">
            Placements, ELO rating deltas, and a public shareable stat card are
            computed automatically in PostgreSQL.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#E5E7EB]">Board Game</Label>
              <select
                value={boardGameId}
                onChange={(e) => setBoardGameId(e.target.value)}
                required
                className="flex h-9 w-full rounded-lg border border-white/[0.1] bg-[#0E1017] px-3 text-xs text-[#F4F0E8]"
              >
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.category} • {g.complexity_weight}w)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-[#E5E7EB]">
                Session Headline
              </Label>
              <Input
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="e.g. Friday Canal Monopoly Showdown"
                className="h-9 border-white/[0.1] bg-[#0E1017] text-xs text-[#F4F0E8]"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#E5E7EB]">Location / Table</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-9 border-white/[0.1] bg-[#0E1017] text-xs text-[#F4F0E8]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-[#E5E7EB]">
                Duration (Minutes)
              </Label>
              <Input
                type="number"
                min={5}
                max={960}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="h-9 border-white/[0.1] bg-[#0E1017] font-mono text-xs text-[#F4F0E8] tabular-nums"
              />
            </div>

            <div className="flex items-end pb-1">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-[#E5E7EB]">
                <input
                  type="checkbox"
                  checked={isFirstPlay}
                  onChange={(e) => setIsFirstPlay(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-[#0E1017] accent-[#A48DFF]"
                />
                First group play of this game
              </label>
            </div>
          </div>

          {/* Player Scores */}
          <div className="space-y-2 rounded-2xl border border-white/[0.08] bg-[#0E1017] p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F4F0E8]">
                Player Scores & Factions ({rows.length} Meeples)
              </span>
              <button
                type="button"
                onClick={addPlayerRow}
                className="inline-flex items-center gap-1 rounded-lg border border-[#A48DFF]/30 bg-[#A48DFF]/10 px-2.5 py-1 text-[11px] font-semibold text-[#A48DFF] hover:bg-[#A48DFF]/20"
              >
                <Plus className="h-3 w-3" />
                Add Player
              </button>
            </div>

            <div className="space-y-2">
              {rows.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 items-center gap-2 rounded-xl border border-white/[0.06] bg-[#13151C] p-2"
                >
                  <div className="col-span-5">
                    <select
                      value={row.player_id}
                      onChange={(e) =>
                        updateRow(idx, { player_id: e.target.value })
                      }
                      className="flex h-8 w-full rounded-md border border-white/[0.1] bg-[#0E1017] px-2 text-xs text-[#F4F0E8]"
                    >
                      {players.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.display_name} ({p.elo_rating} ELO)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-4">
                    <Input
                      value={row.faction_or_role}
                      onChange={(e) =>
                        updateRow(idx, { faction_or_role: e.target.value })
                      }
                      placeholder="Faction / Corp / Map"
                      className="h-8 border-white/[0.1] bg-[#0E1017] text-xs text-[#F4F0E8]"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={row.score}
                      onChange={(e) =>
                        updateRow(idx, { score: Number(e.target.value) })
                      }
                      placeholder="Score"
                      className="h-8 border-white/[0.1] bg-[#0E1017] font-mono text-xs text-[#F4F0E8] tabular-nums"
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removePlayerRow(idx)}
                      disabled={rows.length <= 1}
                      className="rounded-md p-1.5 text-[#9CA3AF] hover:bg-rose-500/15 hover:text-rose-300 disabled:opacity-30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-[#E5E7EB]">
              Signature Table Moment (Appears on Share Card)
            </Label>
            <Input
              value={highlightMoment}
              onChange={(e) => setHighlightMoment(e.target.value)}
              placeholder="e.g. Double sandworm ambush on Turn 8 to steal 4 combat VP!"
              className="h-9 border-white/[0.1] bg-[#0E1017] text-xs text-[#F4F0E8]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-[#E5E7EB]">Match Notes</Label>
            <Textarea
              rows={2}
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Optional strategy notes, expansions used, or table commentary..."
              className="border-white/[0.1] bg-[#0E1017] text-xs text-[#F4F0E8]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-white/[0.1] px-4 py-2 text-xs font-medium text-[#9CA3AF] hover:text-[#F4F0E8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-[#A48DFF] px-4 py-2 text-xs font-semibold text-[#0B0C10] transition hover:bg-[#B8A5FF] disabled:opacity-50"
            >
              {isPending ? "Calculating ELO & Saving..." : "Save & Generate Card"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
