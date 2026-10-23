import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getTenantWorkspace } from "@/lib/supabase/tenant-context";
import type {
  BoardGameCatalogItem,
  DashboardOverviewData,
  HeadToHeadData,
  PlayerLeaderboardItem,
  PlaySessionFeedItem,
  SharedStatCardItem,
} from "./types";

export const getDashboardOverview = cache(
  async (groupId?: string): Promise<DashboardOverviewData> => {
    const workspace = await getTenantWorkspace();
    const targetGroupId = groupId ?? workspace.activeGroupId;
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("bg_dashboard_overview_v2", {
      p_group_id: targetGroupId,
    });

    if (error || !data || typeof data !== "object" || Array.isArray(data)) {
      return {
        group: {
          id: workspace.activeGroupId,
          slug: workspace.activeGroupSlug,
          name: workspace.activeGroupName,
          tagline: workspace.activeGroupTagline,
          city: workspace.activeGroupCity,
          accent_color: "#A48DFF",
        },
        kpis: {
          total_sessions: 0,
          total_hours: 0,
          unique_games_played: 0,
          total_games_in_closet: 0,
          active_players: 0,
          group_h_index: 0,
          avg_session_minutes: 0,
          avg_complexity_weight: 0,
          total_cheers: 0,
        },
        champion: {
          id: "",
          slug: "",
          display_name: "Unranked",
          handle: "@tabletop",
          avatar_color: "#A48DFF",
          elo_rating: 1200,
          games_played: 0,
          wins_count: 0,
          win_rate: 0,
        },
        top_game: {
          id: "",
          slug: "",
          title: "No plays yet",
          category: "Strategy",
          complexity_weight: 2.5,
          cover_color: "#A48DFF",
          plays_count: 0,
          total_hours: 0,
        },
        monthly_activity: [],
        category_breakdown: [],
      };
    }

    return data as unknown as DashboardOverviewData;
  }
);

export const getGamesCatalog = cache(
  async (groupId?: string): Promise<BoardGameCatalogItem[]> => {
    const workspace = await getTenantWorkspace();
    const targetGroupId = groupId ?? workspace.activeGroupId;
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("bg_games_catalog_v2", {
      p_group_id: targetGroupId,
    });

    if (error || !Array.isArray(data)) {
      return [];
    }

    return data as unknown as BoardGameCatalogItem[];
  }
);

export const getPlayersLeaderboard = cache(
  async (groupId?: string): Promise<PlayerLeaderboardItem[]> => {
    const workspace = await getTenantWorkspace();
    const targetGroupId = groupId ?? workspace.activeGroupId;
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("bg_players_leaderboard_v2", {
      p_group_id: targetGroupId,
    });

    if (error || !Array.isArray(data)) {
      return [];
    }

    return data as unknown as PlayerLeaderboardItem[];
  }
);

export const getSessionsFeed = cache(
  async (options?: {
    groupId?: string;
    limit?: number;
    gameSlug?: string;
    playerSlug?: string;
  }): Promise<PlaySessionFeedItem[]> => {
    const workspace = await getTenantWorkspace();
    const targetGroupId = options?.groupId ?? workspace.activeGroupId;
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("bg_sessions_feed_v2", {
      p_group_id: targetGroupId,
      p_limit: options?.limit ?? 50,
      p_game_slug: options?.gameSlug ?? null,
      p_player_slug: options?.playerSlug ?? null,
    });

    if (error || !Array.isArray(data)) {
      return [];
    }

    return data as unknown as PlaySessionFeedItem[];
  }
);

export const getHeadToHeadRivalry = cache(
  async (
    playerAId: string,
    playerBId: string,
    groupId?: string
  ): Promise<HeadToHeadData> => {
    const workspace = await getTenantWorkspace();
    const targetGroupId = groupId ?? workspace.activeGroupId;
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("bg_head_to_head_v2", {
      p_group_id: targetGroupId,
      p_player_a_id: playerAId,
      p_player_b_id: playerBId,
    });

    if (error || !data || typeof data !== "object" || Array.isArray(data)) {
      return {
        summary: {
          shared_sessions_count: 0,
          player_a_wins: 0,
          player_b_wins: 0,
          player_a_better_finishes: 0,
          player_b_better_finishes: 0,
          ties_count: 0,
          player_a_avg_placement: 0,
          player_b_avg_placement: 0,
          player_a_avg_score: 0,
          player_b_avg_score: 0,
        },
        by_game: [],
      };
    }

    return data as unknown as HeadToHeadData;
  }
);

export const getSharedStatCards = cache(
  async (groupId?: string): Promise<SharedStatCardItem[]> => {
    const workspace = await getTenantWorkspace();
    const targetGroupId = groupId ?? workspace.activeGroupId;
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("bg_shared_cards_v2", {
      p_group_id: targetGroupId,
    });

    if (error || !Array.isArray(data)) {
      return [];
    }

    return data as unknown as SharedStatCardItem[];
  }
);

export const getPublicShareCardByCode = cache(
  async (shareCode: string): Promise<SharedStatCardItem | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("bg_public_share_card_v2", {
      p_share_code: shareCode,
    });

    if (error || !data || typeof data !== "object" || Array.isArray(data)) {
      return null;
    }

    const raw = data as Record<string, unknown>;
    if (!raw.id) return null;

    return data as unknown as SharedStatCardItem;
  }
);
