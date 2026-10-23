"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
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
import { createPlayerAction } from "@/app/actions/boardgames";

const AVATAR_COLORS = [
  "#A48DFF",
  "#FF6B6B",
  "#5F8F8B",
  "#F59E0B",
  "#38BDF8",
  "#10B981",
];

export function AddPlayerDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [tagline, setTagline] = useState("");
  const [favoriteCategory, setFavoriteCategory] = useState<
    | "Eurogame"
    | "Strategy"
    | "Deckbuilder"
    | "Engine Builder"
    | "Thematic"
    | "Cooperative"
    | "Abstract"
  >("Strategy");
  const [avatarColor, setAvatarColor] = useState("#A48DFF");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createPlayerAction({
        display_name: displayName,
        handle,
        tagline,
        favorite_category: favoriteCategory,
        avatar_color: avatarColor,
      });

      if (!res.success) {
        toast.error(res.error ?? "Failed to add player");
        return;
      }

      toast.success(
        `Registered ${res.data?.display_name} at 1200 starting ELO!`
      );
      setOpen(false);
      setDisplayName("");
      setHandle("");
      setTagline("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          data-testid="open-add-player-dialog"
          className="inline-flex items-center gap-2 rounded-xl bg-[#A48DFF] px-4 py-2 text-xs font-semibold text-[#0B0C10] transition hover:bg-[#B8A5FF]"
        >
          <UserPlus className="h-4 w-4" />
          Add Club Player
        </button>
      </DialogTrigger>

      <DialogContent className="border-white/[0.12] bg-[#13151C] text-[#F4F0E8] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[#F4F0E8]">
            <UserPlus className="h-5 w-5 text-[#A48DFF]" />
            Register Club Meeple
          </DialogTitle>
          <DialogDescription className="text-xs text-[#9CA3AF]">
            New players enter the club leaderboard at 1200 ELO.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-3.5">
          <div className="space-y-1.5">
            <Label className="text-xs">Display Name *</Label>
            <Input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Bram van Dijk"
              className="h-9 border-white/[0.1] bg-[#0E1017] text-xs text-[#F4F0E8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Social Handle</Label>
              <Input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@bram_meeple"
                className="h-9 border-white/[0.1] bg-[#0E1017] text-xs text-[#F4F0E8]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Favorite Archetype</Label>
              <select
                value={favoriteCategory}
                onChange={(e) =>
                  setFavoriteCategory(
                    e.target.value as typeof favoriteCategory
                  )
                }
                className="flex h-9 w-full rounded-lg border border-white/[0.1] bg-[#0E1017] px-2.5 text-xs text-[#F4F0E8]"
              >
                <option value="Strategy">Strategy</option>
                <option value="Eurogame">Eurogame</option>
                <option value="Deckbuilder">Deckbuilder</option>
                <option value="Engine Builder">Engine Builder</option>
                <option value="Thematic">Thematic</option>
                <option value="Cooperative">Cooperative</option>
                <option value="Abstract">Abstract</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Player Tagline / Playstyle</Label>
            <Input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Never passes up an early science engine."
              className="h-9 border-white/[0.1] bg-[#0E1017] text-xs text-[#F4F0E8]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Meeple Color</Label>
            <div className="flex items-center gap-2 pt-1">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  className={`h-6 w-6 rounded-full border-2 transition ${
                    avatarColor === c
                      ? "scale-110 border-white"
                      : "border-transparent opacity-70"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
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
              {isPending ? "Registering..." : "Register Player"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
