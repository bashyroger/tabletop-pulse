"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireGroupAccess } from "@/lib/auth/workspace";
import type { Json } from "@/lib/supabase/database.types";
import {
  cheerSessionSchema,
  createGameSchema,
  createPlayerSchema,
  createShareCardSchema,
  logSessionSchema,
  type CheerSessionInput,
  type CreateGameInput,
  type CreatePlayerInput,
  type CreateShareCardInput,
  type LogSessionInput,
} from "@/lib/boardgames/schemas";

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function createGameAction(
  rawInput: CreateGameInput
): Promise<ActionResponse<{ id: string; slug: string; title: string }>> {
  const parsed = createGameSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid board game details",
    };
  }

  try {
    const workspace = await requireGroupAccess("editor");
    const supabase = await createClient();
    const input = parsed.data;

    const { data, error } = await supabase.rpc("bg_create_game_v2", {
      p_group_id: workspace.activeGroupId,
      p_title: input.title,
      p_subtitle: input.subtitle,
      p_designer: input.designer,
      p_publisher: input.publisher,
      p_release_year: input.release_year,
      p_min_players: input.min_players,
      p_max_players: Math.max(input.max_players, input.min_players),
      p_min_playtime_minutes: input.min_playtime_minutes,
      p_max_playtime_minutes: Math.max(
        input.max_playtime_minutes,
        input.min_playtime_minutes
      ),
      p_complexity_weight: input.complexity_weight,
      p_category: input.category,
      p_scoring_mode: input.scoring_mode,
      p_cover_color: input.cover_color,
      p_bgg_rank: input.bgg_rank ?? null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/");
    revalidatePath("/games");
    revalidatePath("/sessions");

    const record = (data ?? {}) as Record<string, unknown>;
    return {
      success: true,
      data: {
        id: String(record.id ?? ""),
        slug: String(record.slug ?? ""),
        title: String(record.title ?? input.title),
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to add board game",
    };
  }
}

export async function createPlayerAction(
  rawInput: CreatePlayerInput
): Promise<ActionResponse<{ id: string; slug: string; display_name: string }>> {
  const parsed = createPlayerSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid player profile",
    };
  }

  try {
    const workspace = await requireGroupAccess("editor");
    const supabase = await createClient();
    const input = parsed.data;

    const { data, error } = await supabase.rpc("bg_create_player_v2", {
      p_group_id: workspace.activeGroupId,
      p_display_name: input.display_name,
      p_handle: input.handle,
      p_tagline: input.tagline,
      p_favorite_category: input.favorite_category,
      p_avatar_color: input.avatar_color,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/");
    revalidatePath("/players");
    revalidatePath("/rivalries");
    revalidatePath("/sessions");

    const record = (data ?? {}) as Record<string, unknown>;
    return {
      success: true,
      data: {
        id: String(record.id ?? ""),
        slug: String(record.slug ?? ""),
        display_name: String(record.display_name ?? input.display_name),
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to register player",
    };
  }
}

export async function logSessionAction(
  rawInput: LogSessionInput
): Promise<ActionResponse<{ session_id: string; share_slug: string }>> {
  const parsed = logSessionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid match log payload",
    };
  }

  try {
    const workspace = await requireGroupAccess("editor");
    const supabase = await createClient();
    const input = parsed.data;

    const { data, error } = await supabase.rpc("bg_log_session_v2", {
      p_group_id: workspace.activeGroupId,
      p_board_game_id: input.board_game_id,
      p_played_at: input.played_at ?? new Date().toISOString(),
      p_duration_minutes: input.duration_minutes,
      p_location: input.location,
      p_session_title: input.session_title,
      p_session_notes: input.session_notes,
      p_highlight_moment: input.highlight_moment,
      p_is_first_play: input.is_first_play,
      p_results: input.results as unknown as Json,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/");
    revalidatePath("/sessions");
    revalidatePath("/games");
    revalidatePath("/players");
    revalidatePath("/rivalries");
    revalidatePath("/share-studio");

    const record = (data ?? {}) as Record<string, unknown>;
    return {
      success: true,
      data: {
        session_id: String(record.session_id ?? ""),
        share_slug: String(record.share_slug ?? ""),
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to log play session",
    };
  }
}

export async function cheerSessionAction(
  rawInput: CheerSessionInput
): Promise<ActionResponse<{ session_id: string; likes_count: number }>> {
  const parsed = cheerSessionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid cheer payload",
    };
  }

  try {
    const supabase = await createClient();
    const input = parsed.data;

    const { data, error } = await supabase.rpc("bg_cheer_session_v2", {
      p_session_id: input.session_id,
      p_reactor_name: input.reactor_name,
      p_reaction_type: input.reaction_type,
      p_comment_text: input.comment_text,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/");
    revalidatePath("/sessions");

    const record = (data ?? {}) as Record<string, unknown>;
    return {
      success: true,
      data: {
        session_id: String(record.session_id ?? input.session_id),
        likes_count: Number(record.likes_count ?? 1),
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to cheer session",
    };
  }
}

export async function createShareCardAction(
  rawInput: CreateShareCardInput
): Promise<ActionResponse<{ id: string; share_code: string }>> {
  const parsed = createShareCardSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid share card payload",
    };
  }

  try {
    const workspace = await requireGroupAccess("editor");
    const supabase = await createClient();
    const input = parsed.data;

    const { data, error } = await supabase.rpc("bg_create_share_card_v2", {
      p_group_id: workspace.activeGroupId,
      p_card_type: input.card_type,
      p_title: input.title,
      p_subtitle: input.subtitle,
      p_theme_preset: input.theme_preset,
      p_session_id: input.session_id ?? null,
      p_player_id: input.player_id ?? null,
      p_board_game_id: input.board_game_id ?? null,
      p_snapshot_payload: input.snapshot_payload as unknown as Json,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/share-studio");
    revalidatePath("/");

    const record = (data ?? {}) as Record<string, unknown>;
    return {
      success: true,
      data: {
        id: String(record.id ?? ""),
        share_code: String(record.share_code ?? ""),
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create share card",
    };
  }
}
