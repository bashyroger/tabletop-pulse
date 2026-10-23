export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: {
      bg_get_workspace_v2: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      bg_dashboard_overview_v2: {
        Args: { p_group_id?: string | null };
        Returns: Json;
      };
      bg_games_catalog_v2: {
        Args: { p_group_id?: string | null };
        Returns: Json;
      };
      bg_players_leaderboard_v2: {
        Args: { p_group_id?: string | null };
        Returns: Json;
      };
      bg_sessions_feed_v2: {
        Args: {
          p_group_id?: string | null;
          p_limit?: number | null;
          p_game_slug?: string | null;
          p_player_slug?: string | null;
        };
        Returns: Json;
      };
      bg_head_to_head_v2: {
        Args: {
          p_group_id: string;
          p_player_a_id: string;
          p_player_b_id: string;
        };
        Returns: Json;
      };
      bg_shared_cards_v2: {
        Args: { p_group_id?: string | null };
        Returns: Json;
      };
      bg_public_share_card_v2: {
        Args: { p_share_code: string };
        Returns: Json;
      };
      bg_create_game_v2: {
        Args: {
          p_group_id: string;
          p_title: string;
          p_subtitle: string;
          p_designer: string;
          p_publisher: string;
          p_release_year: number;
          p_min_players: number;
          p_max_players: number;
          p_min_playtime_minutes: number;
          p_max_playtime_minutes: number;
          p_complexity_weight: number;
          p_category: string;
          p_scoring_mode: string;
          p_cover_color: string;
          p_bgg_rank?: number | null;
        };
        Returns: Json;
      };
      bg_create_player_v2: {
        Args: {
          p_group_id: string;
          p_display_name: string;
          p_handle: string;
          p_tagline: string;
          p_favorite_category: string;
          p_avatar_color: string;
        };
        Returns: Json;
      };
      bg_log_session_v2: {
        Args: {
          p_group_id: string;
          p_board_game_id: string;
          p_played_at: string;
          p_duration_minutes: number;
          p_location: string;
          p_session_title: string;
          p_session_notes: string;
          p_highlight_moment: string;
          p_is_first_play: boolean;
          p_results: Json;
        };
        Returns: Json;
      };
      bg_cheer_session_v2: {
        Args: {
          p_session_id: string;
          p_reactor_name?: string;
          p_reaction_type?: string;
          p_comment_text?: string;
        };
        Returns: Json;
      };
      bg_create_share_card_v2: {
        Args: {
          p_group_id: string;
          p_card_type: string;
          p_title: string;
          p_subtitle: string;
          p_theme_preset: string;
          p_session_id?: string | null;
          p_player_id?: string | null;
          p_board_game_id?: string | null;
          p_snapshot_payload?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
  boardgames: {
    Tables: {
      groups: {
        Row: {
          id: string;
          slug: string;
          name: string;
          tagline: string;
          city: string;
          accent_color: string;
          is_public: boolean;
          status: string;
          created_at: string;
        };
      };
      games: {
        Row: {
          id: string;
          group_id: string;
          slug: string;
          title: string;
          subtitle: string;
          designer: string;
          publisher: string;
          release_year: number;
          min_players: number;
          max_players: number;
          min_playtime_minutes: number;
          max_playtime_minutes: number;
          complexity_weight: number;
          category: string;
          scoring_mode: string;
          cover_color: string;
          bgg_rank: number | null;
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      players: {
        Row: {
          id: string;
          group_id: string;
          user_id: string | null;
          slug: string;
          display_name: string;
          handle: string;
          avatar_color: string;
          tagline: string;
          favorite_category: string;
          elo_rating: number;
          is_guest: boolean;
          is_public_profile: boolean;
          created_at: string;
        };
      };
      play_sessions: {
        Row: {
          id: string;
          group_id: string;
          board_game_id: string;
          share_slug: string;
          played_at: string;
          duration_minutes: number;
          location: string;
          session_title: string;
          session_notes: string;
          highlight_moment: string;
          is_cooperative_win: boolean | null;
          is_first_play_for_group: boolean;
          is_public_shared: boolean;
          likes_count: number;
          created_by: string | null;
          created_at: string;
        };
      };
    };
  };
};
