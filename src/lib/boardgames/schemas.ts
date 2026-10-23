import { z } from "zod";

export const createGameSchema = z.object({
  title: z.string().trim().min(2, "Game title must be at least 2 characters"),
  subtitle: z.string().trim().max(180).default(""),
  designer: z.string().trim().max(120).default(""),
  publisher: z.string().trim().max(120).default(""),
  release_year: z.coerce.number().int().min(1900).max(2035).default(2024),
  min_players: z.coerce.number().int().min(1).max(20).default(1),
  max_players: z.coerce.number().int().min(1).max(20).default(4),
  min_playtime_minutes: z.coerce.number().int().min(5).max(720).default(45),
  max_playtime_minutes: z.coerce.number().int().min(5).max(720).default(90),
  complexity_weight: z.coerce.number().min(1).max(5).default(2.8),
  category: z
    .enum([
      "Eurogame",
      "Strategy",
      "Deckbuilder",
      "Engine Builder",
      "Thematic",
      "Cooperative",
      "Abstract",
      "Party",
    ])
    .default("Strategy"),
  scoring_mode: z
    .enum(["highest_wins", "lowest_wins", "cooperative"])
    .default("highest_wins"),
  cover_color: z.string().trim().min(4).max(20).default("#A48DFF"),
  bgg_rank: z.coerce.number().int().min(1).max(50000).optional().nullable(),
});

export type CreateGameInput = z.infer<typeof createGameSchema>;

export const createPlayerSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(2, "Player name must be at least 2 characters"),
  handle: z.string().trim().max(50).default(""),
  tagline: z.string().trim().max(160).default(""),
  favorite_category: z
    .enum([
      "Eurogame",
      "Strategy",
      "Deckbuilder",
      "Engine Builder",
      "Thematic",
      "Cooperative",
      "Abstract",
    ])
    .default("Strategy"),
  avatar_color: z.string().trim().min(4).max(20).default("#A48DFF"),
});

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;

export const sessionResultEntrySchema = z.object({
  player_id: z.string().uuid("Select a valid player"),
  score: z.coerce.number().min(-999).max(99999),
  faction_or_role: z.string().trim().max(100).default(""),
  is_new_player: z.boolean().default(false),
});

export const logSessionSchema = z.object({
  board_game_id: z.string().uuid("Select a board game"),
  played_at: z.string().optional(),
  duration_minutes: z.coerce.number().int().min(5).max(960).default(90),
  location: z.string().trim().min(2).max(100).default("Jordaan Boardroom"),
  session_title: z.string().trim().min(2, "Session title is required").max(140),
  session_notes: z.string().trim().max(500).default(""),
  highlight_moment: z.string().trim().max(280).default(""),
  is_first_play: z.boolean().default(false),
  results: z
    .array(sessionResultEntrySchema)
    .min(1, "Include at least 1 player score"),
});

export type LogSessionInput = z.infer<typeof logSessionSchema>;

export const cheerSessionSchema = z.object({
  session_id: z.string().uuid(),
  reactor_name: z.string().trim().min(1).max(80).default("Tabletop Fan"),
  reaction_type: z
    .enum(["trophy", "fire", "dice", "mindblown"])
    .default("trophy"),
  comment_text: z.string().trim().max(240).default(""),
});

export type CheerSessionInput = z.infer<typeof cheerSessionSchema>;

export const createShareCardSchema = z.object({
  card_type: z.enum([
    "session_recap",
    "player_spotlight",
    "group_season",
    "game_mastery",
    "rivalry_head_to_head",
  ]),
  title: z.string().trim().min(3, "Card title must be at least 3 characters").max(120),
  subtitle: z.string().trim().max(160).default(""),
  theme_preset: z
    .enum([
      "midnight-gold",
      "lavender-noise",
      "emerald-tabletop",
      "crimson-meeple",
    ])
    .default("midnight-gold"),
  session_id: z.string().uuid().optional().nullable(),
  player_id: z.string().uuid().optional().nullable(),
  board_game_id: z.string().uuid().optional().nullable(),
  snapshot_payload: z.record(z.string(), z.unknown()).default({}),
});

export type CreateShareCardInput = z.infer<typeof createShareCardSchema>;
