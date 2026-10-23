"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  Crown,
  Dice5,
  ExternalLink,
  Flame,
  Sparkles,
  Swords,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  SharedStatCardItem,
  ShareThemePreset,
} from "@/lib/boardgames/types";

const THEME_STYLES: Record<
  ShareThemePreset,
  {
    wrapper: string;
    badge: string;
    accentText: string;
    pillBg: string;
    glow: string;
  }
> = {
  "midnight-gold": {
    wrapper:
      "from-[#171824] via-[#10121B] to-[#1E1910] border-amber-400/30 shadow-[0_20px_50px_rgba(245,158,11,0.12)]",
    badge: "bg-amber-400/15 text-amber-300 border-amber-400/30",
    accentText: "text-amber-300",
    pillBg: "bg-amber-400/10 border-amber-400/20",
    glow: "bg-amber-400/20",
  },
  "lavender-noise": {
    wrapper:
      "from-[#19162B] via-[#11131D] to-[#1A1429] border-[#A48DFF]/35 shadow-[0_20px_50px_rgba(164,141,255,0.16)]",
    badge: "bg-[#A48DFF]/15 text-[#A48DFF] border-[#A48DFF]/35",
    accentText: "text-[#A48DFF]",
    pillBg: "bg-[#A48DFF]/10 border-[#A48DFF]/25",
    glow: "bg-[#A48DFF]/20",
  },
  "emerald-tabletop": {
    wrapper:
      "from-[#0F2220] via-[#10151B] to-[#122620] border-emerald-400/30 shadow-[0_20px_50px_rgba(16,185,129,0.14)]",
    badge: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
    accentText: "text-emerald-300",
    pillBg: "bg-emerald-400/10 border-emerald-400/20",
    glow: "bg-emerald-400/20",
  },
  "crimson-meeple": {
    wrapper:
      "from-[#261319] via-[#12131C] to-[#23141B] border-[#FF6B6B]/35 shadow-[0_20px_50px_rgba(255,107,107,0.15)]",
    badge: "bg-[#FF6B6B]/15 text-[#FF6B6B] border-[#FF6B6B]/35",
    accentText: "text-[#FF6B6B]",
    pillBg: "bg-[#FF6B6B]/10 border-[#FF6B6B]/25",
    glow: "bg-[#FF6B6B]/20",
  },
};

const CARD_TYPE_LABELS: Record<string, string> = {
  session_recap: "Match Night Recap",
  player_spotlight: "Player ELO Spotlight",
  group_season: "Club Season Wrapped",
  game_mastery: "Board Game Mastery",
  rivalry_head_to_head: "Head-to-Head Rivalry",
};

interface ShareCardRendererProps {
  card: SharedStatCardItem;
  showActions?: boolean;
  compact?: boolean;
}

export function ShareCardRenderer({
  card,
  showActions = true,
  compact = false,
}: ShareCardRendererProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const themeKey: ShareThemePreset =
    card.theme_preset in THEME_STYLES ? card.theme_preset : "midnight-gold";
  const theme = THEME_STYLES[themeKey];
  const payload = card.snapshot_payload ?? {};

  const results = Array.isArray(payload.results)
    ? (payload.results as Array<Record<string, unknown>>)
    : [];

  const scalarEntries = Object.entries(payload).filter(
    ([key, val]) =>
      key !== "results" &&
      (typeof val === "string" ||
        typeof val === "number" ||
        typeof val === "boolean")
  );

  function getShareUrl() {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/share/${card.share_code}`;
    }
    return `/share/${card.share_code}`;
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopiedLink(true);
      toast.success("Public stat card link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  }

  async function handleCopySummary() {
    const lines = [
      `🎲 ${card.title}`,
      card.subtitle ? `📊 ${card.subtitle}` : "",
      ...scalarEntries
        .slice(0, 4)
        .map(
          ([k, v]) =>
            `• ${k.replace(/_/g, " ").toUpperCase()}: ${String(v)}`
        ),
      `🔗 ${getShareUrl()}`,
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopiedSummary(true);
      toast.success("Formatted social post copied!");
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      toast.error("Could not copy summary");
    }
  }

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border bg-gradient-to-br p-6 transition-all",
          theme.wrapper,
          compact ? "p-5" : "p-6 sm:p-8"
        )}
      >
        {/* Decorative ambient glow */}
        <div
          className={cn(
            "pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full blur-3xl",
            theme.glow
          )}
        />

        {/* Card Top Metadata */}
        <div className="relative flex flex-wrap items-center justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-semibold tracking-wider uppercase",
              theme.badge
            )}
          >
            {card.card_type === "rivalry_head_to_head" ? (
              <Swords className="h-3.5 w-3.5" />
            ) : card.card_type === "player_spotlight" ? (
              <Crown className="h-3.5 w-3.5" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {CARD_TYPE_LABELS[card.card_type] ?? "Tabletop Stat Card"}
          </span>

          <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#9CA3AF]">
            <Dice5 className="h-3.5 w-3.5 text-[#A48DFF]" />
            {card.group_name ?? "Amsterdam Meeple Society"}
          </span>
        </div>

        {/* Title & Subtitle */}
        <div className="relative mt-5 space-y-1.5">
          <h3
            className={cn(
              "font-bold tracking-tight text-[#F4F0E8]",
              compact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"
            )}
          >
            {card.title}
          </h3>
          {card.subtitle ? (
            <p className={cn("text-xs font-medium sm:text-sm", theme.accentText)}>
              {card.subtitle}
            </p>
          ) : null}
        </div>

        {/* If session recap has player standings, render podium rows */}
        {results.length > 0 ? (
          <div className="relative mt-5 space-y-2">
            {results.slice(0, 4).map((r, idx) => {
              const placement = Number(r.placement ?? idx + 1);
              const isWinner = Boolean(r.is_winner || placement === 1);
              const eloDelta = Number(r.elo_delta ?? 0);
              return (
                <div
                  key={`${String(r.player_name)}-${idx}`}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-3.5 py-2.5",
                    isWinner
                      ? "border-amber-400/35 bg-amber-400/10"
                      : "border-white/[0.08] bg-black/25"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-bold tabular-nums",
                        isWinner
                          ? "bg-amber-400 text-[#0B0C10]"
                          : "bg-white/[0.08] text-[#9CA3AF]"
                      )}
                    >
                      #{placement}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-[#F4F0E8]">
                        {String(r.player_name ?? "Player")}
                      </p>
                      {r.faction_or_role ? (
                        <p className="text-[11px] text-[#9CA3AF]">
                          {String(r.faction_or_role)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="font-mono text-sm font-bold text-[#F4F0E8] tabular-nums">
                      {String(r.score ?? 0)} VP
                    </span>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums",
                        eloDelta >= 0
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-rose-500/15 text-rose-300"
                      )}
                    >
                      {eloDelta >= 0 ? `+${eloDelta}` : eloDelta} ELO
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Scalar Stat Tiles */}
        {scalarEntries.length > 0 ? (
          <div className="relative mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {scalarEntries.slice(0, 6).map(([key, value]) => (
              <div
                key={key}
                className={cn(
                  "rounded-xl border px-3 py-2.5 backdrop-blur-sm",
                  theme.pillBg
                )}
              >
                <p className="text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                  {key.replace(/_/g, " ")}
                </p>
                <p className="mt-1 truncate font-mono text-xs font-bold text-[#F4F0E8] sm:text-sm tabular-nums">
                  {String(value)}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {/* Footer Watermark */}
        <div className="relative mt-6 flex items-center justify-between border-t border-white/[0.08] pt-3.5 text-[11px] text-[#9CA3AF]">
          <div className="flex items-center gap-3 tabular-nums">
            <span className="inline-flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-[#FF6B6B]" />
              {card.cheers_count} Cheers
            </span>
            <span>•</span>
            <span>{card.views_count} Views</span>
          </div>
          <span className="font-mono text-[10px] tracking-widest text-[#A48DFF] uppercase">
            tabletoppulse.club/share/{card.share_code}
          </span>
        </div>
      </div>

      {/* Share Bar */}
      {showActions ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/[0.08] bg-[#13151C] px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#A48DFF] px-3 py-1.5 text-xs font-semibold text-[#0B0C10] transition hover:bg-[#B8A5FF]"
            >
              {copiedLink ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copiedLink ? "Copied Link!" : "Copy Share Link"}
            </button>
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[#F4F0E8] transition hover:border-[#A48DFF]/40"
            >
              {copiedSummary ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Trophy className="h-3.5 w-3.5 text-[#A48DFF]" />
              )}
              {copiedSummary ? "Summary Copied" : "Copy Social Post"}
            </button>
          </div>

          <Link
            href={`/share/${card.share_code}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#A48DFF] hover:underline"
          >
            Open Public Card
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
