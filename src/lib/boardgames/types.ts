export type ScoringMode = "highest_wins" | "lowest_wins" | "cooperative";

export type ReactionType = "trophy" | "fire" | "dice" | "mindblown";

export type ShareCardType =
  | "session_recap"
  | "player_spotlight"
  | "group_season"
  | "game_mastery"
  | "rivalry_head_to_head";

export type ShareThemePreset =
  | "midnight-gold"
  | "lavender-noise"
  | "emerald-tabletop"
  | "crimson-meeple";

export interface GroupInfo {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  city: string;
  accent_color: string;
}

export interface DashboardKpis {
  total_sessions: number;
  total_hours: number;
  unique_games_played: number;
  total_games_in_closet: number;
  active_players: number;
  group_h_index: number;
  avg_session_minutes: number;
  avg_complexity_weight: number;
  total_cheers: number;
}

export interface DashboardChampion {
  id: string;
  slug: string;
  display_name: string;
  handle: string;
  avatar_color: string;
  elo_rating: number;
  games_played: number;
  wins_count: number;
  win_rate: number;
}

export interface DashboardTopGame {
  id: string;
  slug: string;
  title: string;
  category: string;
  complexity_weight: number;
  cover_color: string;
  plays_count: number;
  total_hours: number;
}

export interface MonthlyActivityPoint {
  month_key: string;
  month_label: string;
  sessions_count: number;
  hours_played: number;
  unique_games: number;
}

export interface CategoryBreakdownPoint {
  category: string;
  games_count: number;
  sessions_count: number;
  hours_played: number;
}

export interface DashboardOverviewData {
  group: GroupInfo;
  kpis: DashboardKpis;
  champion: DashboardChampion;
  top_game: DashboardTopGame;
  monthly_activity: MonthlyActivityPoint[];
  category_breakdown: CategoryBreakdownPoint[];
}

export interface BoardGameCatalogItem {
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
  scoring_mode: ScoringMode;
  cover_color: string;
  bgg_rank: number | null;
  is_favorite: boolean;
  plays_count: number;
  total_hours: number;
  avg_duration_minutes: number;
  last_played_at: string | null;
  avg_score: number;
  high_score: number;
  high_score_player_name: string | null;
  reigning_champion_name: string | null;
  champion_wins: number;
  unique_players_count: number;
}

export interface PlayerLeaderboardItem {
  id: string;
  group_id: string;
  slug: string;
  display_name: string;
  handle: string;
  avatar_color: string;
  tagline: string;
  favorite_category: string;
  elo_rating: number;
  is_guest: boolean;
  games_played: number;
  wins_count: number;
  podium_count: number;
  win_rate: number;
  podium_rate: number;
  avg_placement: number;
  total_hours: number;
  best_score: number;
  elo_delta_total: number;
  player_h_index: number;
  signature_game_title: string;
}

export interface SessionPlayerResult {
  id: string;
  player_id: string;
  player_slug: string;
  player_name: string;
  player_handle: string;
  avatar_color: string;
  faction_or_role: string;
  score: number;
  placement: number;
  is_winner: boolean;
  is_new_player: boolean;
  elo_delta: number;
  score_breakdown: Record<string, number | string>;
}

export interface SessionCheerItem {
  id: string;
  reactor_name: string;
  reaction_type: ReactionType;
  comment_text: string;
  created_at: string;
}

export interface PlaySessionFeedItem {
  id: string;
  group_id: string;
  share_slug: string;
  played_at: string;
  duration_minutes: number;
  location: string;
  session_title: string;
  session_notes: string;
  highlight_moment: string;
  is_cooperative_win: boolean | null;
  is_first_play_for_group: boolean;
  likes_count: number;
  game: {
    id: string;
    slug: string;
    title: string;
    category: string;
    complexity_weight: number;
    cover_color: string;
    scoring_mode: ScoringMode;
  };
  results: SessionPlayerResult[];
  cheers_count: number;
  cheers: SessionCheerItem[];
}

export interface HeadToHeadSummary {
  shared_sessions_count: number;
  player_a_wins: number;
  player_b_wins: number;
  player_a_better_finishes: number;
  player_b_better_finishes: number;
  ties_count: number;
  player_a_avg_placement: number;
  player_b_avg_placement: number;
  player_a_avg_score: number;
  player_b_avg_score: number;
}

export interface HeadToHeadGameBreakdown {
  game_id: string;
  game_slug: string;
  game_title: string;
  cover_color: string;
  shared_plays: number;
  a_outplaced_b: number;
  b_outplaced_a: number;
  a_avg_score: number;
  b_avg_score: number;
}

export interface HeadToHeadData {
  summary: HeadToHeadSummary;
  by_game: HeadToHeadGameBreakdown[];
}

export interface SharedStatCardItem {
  id: string;
  group_id: string;
  group_name?: string;
  group_city?: string;
  share_code: string;
  card_type: ShareCardType;
  title: string;
  subtitle: string;
  theme_preset: ShareThemePreset;
  session_id: string | null;
  player_id: string | null;
  board_game_id: string | null;
  snapshot_payload: Record<string, unknown>;
  cheers_count: number;
  views_count: number;
  created_at: string;
}
