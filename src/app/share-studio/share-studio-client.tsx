"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Palette, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShareCardRenderer } from "@/components/boardgames/share-card-renderer";
import { createShareCardAction } from "@/app/actions/boardgames";
import type {
  BoardGameCatalogItem,
  DashboardOverviewData,
  PlayerLeaderboardItem,
  ShareCardType,
  SharedStatCardItem,
  ShareThemePreset,
} from "@/lib/boardgames/types";

interface ShareStudioClientProps {
  overview: DashboardOverviewData;
  games: BoardGameCatalogItem[];
  players: PlayerLeaderboardItem[];
  existingCards: SharedStatCardItem[];
}

export function ShareStudioClient({
  overview,
  games,
  players,
  existingCards,
}: ShareStudioClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [cardType, setCardType] = useState<ShareCardType>("group_season");
  const [themePreset, setThemePreset] =
    useState<ShareThemePreset>("midnight-gold");
  const [selectedPlayerId, setSelectedPlayerId] = useState(
    players[0]?.id ?? ""
  );
  const [selectedGameId, setSelectedGameId] = useState(games[0]?.id ?? "");
  const [customTitle, setCustomTitle] = useState("");
  const [customSubtitle, setCustomSubtitle] = useState("");

  const activePlayer = useMemo(
    () => players.find((p) => p.id === selectedPlayerId) ?? players[0],
    [players, selectedPlayerId]
  );

  const activeGame = useMemo(
    () => games.find((g) => g.id === selectedGameId) ?? games[0],
    [games, selectedGameId]
  );

  const livePreviewCard: SharedStatCardItem = useMemo(() => {
    if (cardType === "player_spotlight" && activePlayer) {
      return {
        id: "preview",
        group_id: overview.group.id,
        group_name: overview.group.name,
        share_code: `${activePlayer.slug}-spotlight`,
        card_type: "player_spotlight",
        title:
          customTitle.trim() ||
          `${activePlayer.display_name} • ${activePlayer.elo_rating} ELO Spotlight`,
        subtitle:
          customSubtitle.trim() ||
          `${activePlayer.win_rate}% Win Rate • ${activePlayer.podium_rate}% Podium Rate • H-Index ${activePlayer.player_h_index}`,
        theme_preset: themePreset,
        session_id: null,
        player_id: activePlayer.id,
        board_game_id: null,
        snapshot_payload: {
          player_name: activePlayer.display_name,
          handle: activePlayer.handle,
          elo_rating: activePlayer.elo_rating,
          win_rate: `${activePlayer.win_rate}%`,
          podium_rate: `${activePlayer.podium_rate}%`,
          signature_game: activePlayer.signature_game_title,
        },
        cheers_count: 18,
        views_count: 64,
        created_at: new Date().toISOString(),
      };
    }

    if (cardType === "game_mastery" && activeGame) {
      return {
        id: "preview",
        group_id: overview.group.id,
        group_name: overview.group.name,
        share_code: `${activeGame.slug}-mastery`,
        card_type: "game_mastery",
        title:
          customTitle.trim() || `${activeGame.title} • Club Mastery Dossier`,
        subtitle:
          customSubtitle.trim() ||
          `${activeGame.plays_count} Plays • ${activeGame.total_hours}h Played • Record: ${activeGame.high_score} VP`,
        theme_preset: themePreset,
        session_id: null,
        player_id: null,
        board_game_id: activeGame.id,
        snapshot_payload: {
          game_title: activeGame.title,
          category: activeGame.category,
          bgg_weight: `${activeGame.complexity_weight} / 5.00`,
          plays_count: activeGame.plays_count,
          reigning_champion: activeGame.reigning_champion_name ?? "Open",
          high_score: `${activeGame.high_score} VP`,
        },
        cheers_count: 14,
        views_count: 52,
        created_at: new Date().toISOString(),
      };
    }

    return {
      id: "preview",
      group_id: overview.group.id,
      group_name: overview.group.name,
      share_code: "club-season-wrapped",
      card_type: "group_season",
      title:
        customTitle.trim() || `${overview.group.name} • Season Wrapped`,
      subtitle:
        customSubtitle.trim() ||
        `${overview.kpis.total_sessions} Matches • ${overview.kpis.total_hours} Table Hours • Club H-Index ${overview.kpis.group_h_index}`,
      theme_preset: themePreset,
      session_id: null,
      player_id: null,
      board_game_id: null,
      snapshot_payload: {
        total_sessions: overview.kpis.total_sessions,
        table_hours: `${overview.kpis.total_hours}h`,
        group_h_index: overview.kpis.group_h_index,
        elo_champion: `${overview.champion.display_name} (${overview.champion.elo_rating} ELO)`,
        most_played_game: `${overview.top_game.title} (${overview.top_game.plays_count}×)`,
        avg_complexity: `${overview.kpis.avg_complexity_weight} / 5.0`,
      },
      cheers_count: overview.kpis.total_cheers,
      views_count: 120,
      created_at: new Date().toISOString(),
    };
  }, [
    cardType,
    themePreset,
    activePlayer,
    activeGame,
    customTitle,
    customSubtitle,
    overview,
  ]);

  function handleMintCard(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createShareCardAction({
        card_type: livePreviewCard.card_type,
        title: livePreviewCard.title,
        subtitle: livePreviewCard.subtitle,
        theme_preset: livePreviewCard.theme_preset,
        player_id: livePreviewCard.player_id,
        board_game_id: livePreviewCard.board_game_id,
        snapshot_payload: livePreviewCard.snapshot_payload,
      });

      if (!res.success || !res.data) {
        toast.error(res.error ?? "Failed to mint share card");
        return;
      }

      toast.success("Public Share Card minted!");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {/* Studio Builder */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Controls */}
        <form
          onSubmit={handleMintCard}
          className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#13151C] p-5 lg:col-span-5"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-[#F4F0E8]">
            <Palette className="h-4 w-4 text-[#A48DFF]" />
            Card Configuration
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Card Archetype</Label>
            <select
              value={cardType}
              onChange={(e) => setCardType(e.target.value as ShareCardType)}
              className="flex h-9 w-full rounded-lg border border-white/[0.1] bg-[#0E1017] px-3 text-xs text-[#F4F0E8]"
            >
              <option value="group_season">Club Season Wrapped</option>
              <option value="player_spotlight">Player ELO Spotlight</option>
              <option value="game_mastery">Board Game Mastery Dossier</option>
            </select>
          </div>

          {cardType === "player_spotlight" ? (
            <div className="space-y-1.5">
              <Label className="text-xs">Select Player</Label>
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-white/[0.1] bg-[#0E1017] px-3 text-xs text-[#F4F0E8]"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name} ({p.elo_rating} ELO)
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {cardType === "game_mastery" ? (
            <div className="space-y-1.5">
              <Label className="text-xs">Select Board Game</Label>
              <select
                value={selectedGameId}
                onChange={(e) => setSelectedGameId(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-white/[0.1] bg-[#0E1017] px-3 text-xs text-[#F4F0E8]"
              >
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.plays_count} plays)
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label className="text-xs">Visual Theme Preset</Label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: "midnight-gold", label: "Midnight Gold" },
                  { id: "lavender-noise", label: "Lavender Noise" },
                  { id: "emerald-tabletop", label: "Emerald Felt" },
                  { id: "crimson-meeple", label: "Crimson Meeple" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemePreset(t.id)}
                  className={`rounded-xl border px-3 py-2 text-left text-xs font-medium transition ${
                    themePreset === t.id
                      ? "border-[#A48DFF] bg-[#A48DFF]/15 text-[#F4F0E8]"
                      : "border-white/[0.08] bg-[#0E1017] text-[#9CA3AF] hover:text-[#F4F0E8]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Custom Headline (Optional)</Label>
            <Input
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder={livePreviewCard.title}
              className="h-9 border-white/[0.1] bg-[#0E1017] text-xs text-[#F4F0E8]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Custom Subtitle (Optional)</Label>
            <Input
              value={customSubtitle}
              onChange={(e) => setCustomSubtitle(e.target.value)}
              placeholder={livePreviewCard.subtitle}
              className="h-9 border-white/[0.1] bg-[#0E1017] text-xs text-[#F4F0E8]"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#A48DFF] px-4 py-2.5 text-xs font-semibold text-[#0B0C10] shadow-md transition hover:bg-[#B8A5FF] disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {isPending ? "Minting Public Link..." : "Mint & Publish Share Card"}
          </button>
        </form>

        {/* Live Preview */}
        <div className="space-y-3 lg:col-span-7">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-[#9CA3AF] uppercase">
              Live Interactive Card Preview
            </span>
            <span className="font-mono text-xs text-[#A48DFF]">
              Theme: {themePreset}
            </span>
          </div>
          <ShareCardRenderer card={livePreviewCard} showActions={false} />
        </div>
      </div>

      {/* Published Cards Gallery */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#F4F0E8]">
            Published Club Stat Cards ({existingCards.length})
          </h2>
          <p className="text-xs text-[#9CA3AF]">
            Every card has a permanent public URL at{" "}
            <code className="font-mono text-[#A48DFF]">/share/[code]</code>
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {existingCards.map((card) => (
            <ShareCardRenderer key={card.id} card={card} compact />
          ))}
        </div>
      </div>
    </div>
  );
}
