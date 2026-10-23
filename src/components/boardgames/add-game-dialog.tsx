"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Boxes, Plus } from "lucide-react";
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
import { createGameAction } from "@/app/actions/boardgames";

const COVER_COLORS = [
  "#A48DFF",
  "#5F8F8B",
  "#FF6B6B",
  "#38BDF8",
  "#F59E0B",
  "#10B981",
];

export function AddGameDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [designer, setDesigner] = useState("");
  const [publisher, setPublisher] = useState("");
  const [releaseYear] = useState(2024);
  const [minPlayers, setMinPlayers] = useState(1);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [minPlaytime, setMinPlaytime] = useState(60);
  const [maxPlaytime, setMaxPlaytime] = useState(120);
  const [complexityWeight, setComplexityWeight] = useState(3.25);
  const [category, setCategory] = useState<
    | "Eurogame"
    | "Strategy"
    | "Deckbuilder"
    | "Engine Builder"
    | "Thematic"
    | "Cooperative"
    | "Abstract"
    | "Party"
  >("Eurogame");
  const [scoringMode, setScoringMode] = useState<
    "highest_wins" | "lowest_wins" | "cooperative"
  >("highest_wins");
  const [coverColor, setCoverColor] = useState("#A48DFF");
  const [bggRank, setBggRank] = useState<string>("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createGameAction({
        title,
        subtitle,
        designer,
        publisher,
        release_year: Number(releaseYear),
        min_players: Number(minPlayers),
        max_players: Number(maxPlayers),
        min_playtime_minutes: Number(minPlaytime),
        max_playtime_minutes: Number(maxPlaytime),
        complexity_weight: Number(complexityWeight),
        category,
        scoring_mode: scoringMode,
        cover_color: coverColor,
        bgg_rank: bggRank ? Number(bggRank) : null,
      });

      if (!res.success) {
        toast.error(res.error ?? "Failed to add board game");
        return;
      }

      toast.success(`Added "${res.data?.title}" to your Club Closet!`);
      setOpen(false);
      setTitle("");
      setSubtitle("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          data-testid="open-add-game-dialog"
          className="inline-flex items-center gap-2 rounded-xl bg-[#A48DFF] px-4 py-2 text-xs font-semibold text-[#0B0C10] transition hover:bg-[#B8A5FF]"
        >
          <Plus className="h-4 w-4" />
          Add Board Game
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/[0.12] bg-[#13151C] text-[#F4F0E8] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[#F4F0E8]">
            <Boxes className="h-5 w-5 text-[#A48DFF]" />
            Add Game to Club Closet
          </DialogTitle>
          <DialogDescription className="text-xs text-[#9CA3AF]">
            Register a board game with its BGG complexity weight, player count,
            and scoring rules.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-3.5">
          <div className="space-y-1.5">
            <Label className="text-xs">Game Title *</Label>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Castles of Burgundy: Special Edition"
              className="h-9 border-white/[0.1] bg-[#0E1017] text-xs text-[#F4F0E8]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Tagline / Subtitle</Label>
            <Input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Dice placement & trade along the Loire Valley."
              className="h-9 border-white/[0.1] bg-[#0E1017] text-xs text-[#F4F0E8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Designer</Label>
              <Input
                value={designer}
                onChange={(e) => setDesigner(e.target.value)}
                placeholder="Stefan Feld"
                className="h-9 border-white/[0.1] bg-[#0E1017] text-xs text-[#F4F0E8]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Publisher</Label>
              <Input
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="Ravensburger / Awaken Realms"
                className="h-9 border-white/[0.1] bg-[#0E1017] text-xs text-[#F4F0E8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as typeof category)
                }
                className="flex h-9 w-full rounded-lg border border-white/[0.1] bg-[#0E1017] px-2.5 text-xs text-[#F4F0E8]"
              >
                <option value="Eurogame">Eurogame</option>
                <option value="Strategy">Strategy</option>
                <option value="Deckbuilder">Deckbuilder</option>
                <option value="Engine Builder">Engine Builder</option>
                <option value="Thematic">Thematic</option>
                <option value="Cooperative">Cooperative</option>
                <option value="Abstract">Abstract</option>
                <option value="Party">Party</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">BGG Weight (1-5)</Label>
              <Input
                type="number"
                step="0.05"
                min={1}
                max={5}
                value={complexityWeight}
                onChange={(e) => setComplexityWeight(Number(e.target.value))}
                className="h-9 border-white/[0.1] bg-[#0E1017] font-mono text-xs text-[#F4F0E8] tabular-nums"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">BGG Rank</Label>
              <Input
                type="number"
                min={1}
                value={bggRank}
                onChange={(e) => setBggRank(e.target.value)}
                placeholder="e.g. 14"
                className="h-9 border-white/[0.1] bg-[#0E1017] font-mono text-xs text-[#F4F0E8] tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            <div className="space-y-1">
              <Label className="text-[11px]">Min Players</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={minPlayers}
                onChange={(e) => setMinPlayers(Number(e.target.value))}
                className="h-8 border-white/[0.1] bg-[#0E1017] font-mono text-xs text-[#F4F0E8]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Max Players</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="h-8 border-white/[0.1] bg-[#0E1017] font-mono text-xs text-[#F4F0E8]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Min Mins</Label>
              <Input
                type="number"
                min={5}
                value={minPlaytime}
                onChange={(e) => setMinPlaytime(Number(e.target.value))}
                className="h-8 border-white/[0.1] bg-[#0E1017] font-mono text-xs text-[#F4F0E8]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Max Mins</Label>
              <Input
                type="number"
                min={5}
                value={maxPlaytime}
                onChange={(e) => setMaxPlaytime(Number(e.target.value))}
                className="h-8 border-white/[0.1] bg-[#0E1017] font-mono text-xs text-[#F4F0E8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Scoring Rule</Label>
              <select
                value={scoringMode}
                onChange={(e) =>
                  setScoringMode(e.target.value as typeof scoringMode)
                }
                className="flex h-9 w-full rounded-lg border border-white/[0.1] bg-[#0E1017] px-2.5 text-xs text-[#F4F0E8]"
              >
                <option value="highest_wins">Highest Score Wins</option>
                <option value="lowest_wins">Lowest Score Wins</option>
                <option value="cooperative">Cooperative Team Game</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Box Accent Color</Label>
              <div className="flex items-center gap-2 pt-1">
                {COVER_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCoverColor(c)}
                    className={`h-6 w-6 rounded-full border-2 transition ${
                      coverColor === c
                        ? "scale-110 border-white"
                        : "border-transparent opacity-70"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-white/[0.1] px-4 py-2 text-xs font-medium text-[#9CA3AF]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-[#A48DFF] px-4 py-2 text-xs font-semibold text-[#0B0C10] hover:bg-[#B8A5FF] disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Add to Closet"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
