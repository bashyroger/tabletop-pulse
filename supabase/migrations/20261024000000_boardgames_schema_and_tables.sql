-- Migration: 20261024000000_boardgames_schema_and_tables.sql
-- Description: Dedicated `boardgames` and `boardgames_private` schemas for TabletopPulse
--              inside the shared Supabase project (`macnasmanager` / `fsbpxifvpjtkrltfizmv`).
--              Completely isolated from `public` tables. Fully idempotent.

-- 1. Create dedicated schemas
CREATE SCHEMA IF NOT EXISTS boardgames;
CREATE SCHEMA IF NOT EXISTS boardgames_private;

REVOKE ALL ON SCHEMA boardgames_private FROM PUBLIC;
GRANT USAGE ON SCHEMA boardgames_private TO anon, authenticated, service_role;

GRANT USAGE ON SCHEMA boardgames TO anon, authenticated, service_role;

-- Expose `boardgames` schema to PostgREST alongside existing schemas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
        ALTER ROLE authenticator SET pgrst.db_schemas = 'public, storage, graphql_public, boardgames';
        NOTIFY pgrst, 'reload config';
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore in local PGlite test harness where `authenticator` role may not exist
    NULL;
END $$;

-- 2. Core Group / Multi-Tenancy Tables in `boardgames`
CREATE TABLE IF NOT EXISTS boardgames.groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    tagline text NOT NULL DEFAULT '',
    city text NOT NULL DEFAULT 'Amsterdam',
    accent_color text NOT NULL DEFAULT '#A48DFF',
    is_public boolean NOT NULL DEFAULT true,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS boardgames.group_members (
    group_id uuid NOT NULL REFERENCES boardgames.groups (id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_bg_group_members_user ON boardgames.group_members (user_id);

CREATE TABLE IF NOT EXISTS boardgames.user_preferences (
    user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    active_group_id uuid REFERENCES boardgames.groups (id) ON DELETE SET NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bg_user_preferences_active_group ON boardgames.user_preferences (active_group_id);

-- 3. Board Games Catalog Table
CREATE TABLE IF NOT EXISTS boardgames.games (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL REFERENCES boardgames.groups (id) ON DELETE CASCADE,
    slug text NOT NULL,
    title text NOT NULL,
    subtitle text NOT NULL DEFAULT '',
    designer text NOT NULL DEFAULT '',
    publisher text NOT NULL DEFAULT '',
    release_year int NOT NULL DEFAULT 2024,
    min_players int NOT NULL DEFAULT 1 CHECK (min_players >= 1),
    max_players int NOT NULL DEFAULT 4 CHECK (max_players >= min_players),
    min_playtime_minutes int NOT NULL DEFAULT 30 CHECK (min_playtime_minutes > 0),
    max_playtime_minutes int NOT NULL DEFAULT 90 CHECK (max_playtime_minutes >= min_playtime_minutes),
    complexity_weight numeric(3,2) NOT NULL DEFAULT 2.50 CHECK (complexity_weight >= 1.00 AND complexity_weight <= 5.00),
    category text NOT NULL DEFAULT 'Strategy',
    scoring_mode text NOT NULL DEFAULT 'highest_wins' CHECK (scoring_mode IN ('highest_wins', 'lowest_wins', 'cooperative')),
    cover_color text NOT NULL DEFAULT '#A48DFF',
    bgg_rank int,
    is_favorite boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (group_id, slug)
);

-- 4. Players (Meeples) Table
CREATE TABLE IF NOT EXISTS boardgames.players (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL REFERENCES boardgames.groups (id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
    slug text NOT NULL,
    display_name text NOT NULL,
    handle text NOT NULL,
    avatar_color text NOT NULL DEFAULT '#A48DFF',
    tagline text NOT NULL DEFAULT '',
    favorite_category text NOT NULL DEFAULT 'Strategy',
    elo_rating int NOT NULL DEFAULT 1200,
    is_guest boolean NOT NULL DEFAULT false,
    is_public_profile boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (group_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_bg_players_user ON boardgames.players (user_id);

-- 5. Play Sessions (Logged Matches) Table
CREATE TABLE IF NOT EXISTS boardgames.play_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL REFERENCES boardgames.groups (id) ON DELETE CASCADE,
    board_game_id uuid NOT NULL REFERENCES boardgames.games (id) ON DELETE CASCADE,
    share_slug text NOT NULL UNIQUE,
    played_at timestamptz NOT NULL DEFAULT now(),
    duration_minutes int NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
    location text NOT NULL DEFAULT 'Home Table',
    session_title text NOT NULL DEFAULT '',
    session_notes text NOT NULL DEFAULT '',
    highlight_moment text NOT NULL DEFAULT '',
    is_cooperative_win boolean,
    is_first_play_for_group boolean NOT NULL DEFAULT false,
    is_public_shared boolean NOT NULL DEFAULT true,
    likes_count int NOT NULL DEFAULT 0,
    created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bg_play_sessions_group_played ON boardgames.play_sessions (group_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_bg_play_sessions_game ON boardgames.play_sessions (board_game_id);
CREATE INDEX IF NOT EXISTS idx_bg_play_sessions_created_by ON boardgames.play_sessions (created_by);

-- 6. Play Session Results (Per-Player Scores & Placements)
CREATE TABLE IF NOT EXISTS boardgames.play_session_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL REFERENCES boardgames.groups (id) ON DELETE CASCADE,
    session_id uuid NOT NULL REFERENCES boardgames.play_sessions (id) ON DELETE CASCADE,
    player_id uuid NOT NULL REFERENCES boardgames.players (id) ON DELETE CASCADE,
    faction_or_role text NOT NULL DEFAULT '',
    score numeric(10,2) NOT NULL DEFAULT 0,
    placement int NOT NULL DEFAULT 1 CHECK (placement >= 1),
    is_winner boolean NOT NULL DEFAULT false,
    is_new_player boolean NOT NULL DEFAULT false,
    elo_delta int NOT NULL DEFAULT 0,
    score_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (session_id, player_id)
);
CREATE INDEX IF NOT EXISTS idx_bg_play_session_results_group ON boardgames.play_session_results (group_id);
CREATE INDEX IF NOT EXISTS idx_bg_play_session_results_player ON boardgames.play_session_results (player_id);

-- 7. Shared Stat Cards (Social Sharing Studio)
CREATE TABLE IF NOT EXISTS boardgames.shared_stat_cards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL REFERENCES boardgames.groups (id) ON DELETE CASCADE,
    share_code text NOT NULL UNIQUE,
    card_type text NOT NULL CHECK (card_type IN ('session_recap', 'player_spotlight', 'group_season', 'game_mastery', 'rivalry_head_to_head')),
    title text NOT NULL,
    subtitle text NOT NULL DEFAULT '',
    theme_preset text NOT NULL DEFAULT 'midnight-gold',
    session_id uuid REFERENCES boardgames.play_sessions (id) ON DELETE SET NULL,
    player_id uuid REFERENCES boardgames.players (id) ON DELETE SET NULL,
    board_game_id uuid REFERENCES boardgames.games (id) ON DELETE SET NULL,
    snapshot_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    cheers_count int NOT NULL DEFAULT 0,
    views_count int NOT NULL DEFAULT 0,
    is_public boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bg_shared_stat_cards_group ON boardgames.shared_stat_cards (group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bg_shared_stat_cards_session ON boardgames.shared_stat_cards (session_id);
CREATE INDEX IF NOT EXISTS idx_bg_shared_stat_cards_player ON boardgames.shared_stat_cards (player_id);
CREATE INDEX IF NOT EXISTS idx_bg_shared_stat_cards_game ON boardgames.shared_stat_cards (board_game_id);

-- 8. Session Cheers & Reactions
CREATE TABLE IF NOT EXISTS boardgames.session_cheers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL REFERENCES boardgames.groups (id) ON DELETE CASCADE,
    session_id uuid NOT NULL REFERENCES boardgames.play_sessions (id) ON DELETE CASCADE,
    reactor_name text NOT NULL DEFAULT 'Tabletop Fan',
    reaction_type text NOT NULL DEFAULT 'trophy' CHECK (reaction_type IN ('trophy', 'fire', 'dice', 'mindblown')),
    comment_text text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bg_session_cheers_group ON boardgames.session_cheers (group_id);
CREATE INDEX IF NOT EXISTS idx_bg_session_cheers_session ON boardgames.session_cheers (session_id, created_at DESC);

-- 9. Enable Row Level Security (RLS) on all `boardgames` tables
ALTER TABLE boardgames.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE boardgames.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE boardgames.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE boardgames.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE boardgames.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE boardgames.play_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE boardgames.play_session_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE boardgames.shared_stat_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE boardgames.session_cheers ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON ALL TABLES IN SCHEMA boardgames TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA boardgames TO authenticated, service_role;
