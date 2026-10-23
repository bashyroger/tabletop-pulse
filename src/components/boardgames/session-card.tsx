"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import {
  Clock,
  Flame,
  MapPin,
  Share2,
  Sparkles,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { cheerSessionAction } from "@/app/actions/boardgames";
import { cn } from "@/lib/utils";
import type { PlaySessionFeedItem } from "@/lib/boardgames/types";

interface SessionCardProps {
  session: PlaySessionFeedItem;
}

export function SessionCard({ session }: SessionCardProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    session.likes_count,
    (current: number, delta: number) => current + delta
  );

  function handleCheer() {
    startTransition(async () => {
      addOptimisticLike(1);
      const res = await cheerSessionAction({
        session_id: session.id,
        reactor_name: "Club Member",
        reaction_type: "fire",
        comment_text: "Great table night!",
      });
      if (res.success) {
        toast.success(`Cheered "${session.session_title}"!`);
      } else {
        toast.error(res.error ?? "Failed to cheer session");
      }
    });
  }

  const playedDate = new Date(session.played_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <article className="rounded-2xl border border-white/[0.08] bg-[#13151C] p-5 transition hover:border-white/[0.15]">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-[#0B0C10] shadow-sm"
            style={{ backgroundColor: session.game.cover_color || "#A48DFF" }}
          >
            {session.game.title.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/games/${session.game.slug}`}
                className="text-xs font-semibold tracking-wider text-[#A48DFF] uppercase hover:underline"
              >
                {session.game.title}
              </Link>
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-[#9CA3AF] tabular-nums">
                Weight {Number(session.game.complexity_weight).toFixed(2)}/5
              </span>
              {session.is_first_play_for_group ? (
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  First Club Play
                </span>
              ) : null}
            </div>
            <h3 className="mt-1 text-base font-bold text-[#F4F0E8]">
              {session.session_title}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#9CA3AF] tabular-nums">
              <span>{playedDate}</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#5F8F8B]" />
                {session.duration_minutes} min
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-[#A48DFF]" />
                {session.location}
              </span>
            </div>
          </div>
        </div>

        {/* Cheer & Share Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={handleCheer}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#FF6B6B]/30 bg-[#FF6B6B]/10 px-3 py-1.5 font-mono text-xs font-semibold text-[#FF6B6B] transition hover:bg-[#FF6B6B]/20 tabular-nums"
          >
            <Flame className="h-3.5 w-3.5" />
            <span>{optimisticLikes}</span>
          </button>
          <Link
            href={`/share/${session.share_slug}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[#F4F0E8] transition hover:border-[#A48DFF]/40"
          >
            <Share2 className="h-3.5 w-3.5 text-[#A48DFF]" />
            Share Card
          </Link>
        </div>
      </div>

      {/* Notes & Highlight Moment */}
      {session.highlight_moment ? (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#A48DFF]/20 bg-[#A48DFF]/[0.06] px-3.5 py-2.5 text-xs text-[#E5E7EB]">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#A48DFF]" />
          <div>
            <span className="font-semibold text-[#A48DFF]">
              Signature Table Moment:{" "}
            </span>
            {session.highlight_moment}
          </div>
        </div>
      ) : null}

      {/* Player Results Table */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {session.results.map((res) => {
          const isWinner = res.is_winner || res.placement === 1;
          return (
            <div
              key={res.id}
              className={cn(
                "flex items-center justify-between rounded-xl border px-3.5 py-2.5",
                isWinner
                  ? "border-amber-400/30 bg-amber-400/[0.07]"
                  : "border-white/[0.06] bg-[#0E1017]"
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold tabular-nums",
                    isWinner
                      ? "bg-amber-400 text-[#0B0C10]"
                      : "bg-white/[0.08] text-[#9CA3AF]"
                  )}
                >
                  {isWinner ? (
                    <Trophy className="h-3.5 w-3.5" />
                  ) : (
                    `#${res.placement}`
                  )}
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/players/${res.player_slug}`}
                    className="block truncate text-xs font-semibold text-[#F4F0E8] hover:text-[#A48DFF]"
                  >
                    {res.player_name}
                  </Link>
                  {res.faction_or_role ? (
                    <p className="truncate text-[11px] text-[#9CA3AF]">
                      {res.faction_or_role}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2.5 text-right tabular-nums">
                <span className="font-mono text-xs font-bold text-[#F4F0E8]">
                  {res.score} VP
                </span>
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                    res.elo_delta >= 0
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-rose-500/15 text-rose-300"
                  )}
                >
                  {res.elo_delta >= 0 ? `+${res.elo_delta}` : res.elo_delta} ELO
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
