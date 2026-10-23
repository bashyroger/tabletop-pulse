-- Migration: 20261024001000_boardgames_rls_and_rpcs_v2.sql
-- Description: Private helper functions in `boardgames_private`, RLS policies on `boardgames.*`,
--              and two-tier `public.bg_*_v2` RPCs for pushed-down board game statistics.

-- ============================================================================
-- 1. RLS HELPER FUNCTIONS IN `boardgames_private`
-- ============================================================================
CREATE OR REPLACE FUNCTION boardgames_private.default_group_id()
RETURNS uuid
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT '9608effa-cb3a-4b11-a099-3d1142e293a3'::uuid;
$$;

CREATE OR REPLACE FUNCTION boardgames_private.active_group_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT COALESCE(
        (
            SELECT m.group_id
            FROM boardgames.group_members m
            JOIN boardgames.groups g ON g.id = m.group_id AND g.status = 'active'
            LEFT JOIN boardgames.user_preferences p
                   ON p.user_id = m.user_id AND p.active_group_id = m.group_id
            WHERE m.user_id = (SELECT auth.uid())
            ORDER BY (p.user_id IS NOT NULL) DESC, m.created_at ASC
            LIMIT 1
        ),
        (
            SELECT g.id
            FROM boardgames.groups g
            WHERE g.is_public = true AND g.status = 'active'
            ORDER BY (g.id = '9608effa-cb3a-4b11-a099-3d1142e293a3'::uuid) DESC, g.created_at ASC
            LIMIT 1
        )
    );
$$;

CREATE OR REPLACE FUNCTION boardgames_private.can_read_group(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM boardgames.groups g
        WHERE g.id = p_group_id
          AND g.status = 'active'
          AND (
              g.is_public = true
              OR EXISTS (
                  SELECT 1
                  FROM boardgames.group_members m
                  WHERE m.group_id = g.id
                    AND m.user_id = (SELECT auth.uid())
              )
          )
    );
$$;

CREATE OR REPLACE FUNCTION boardgames_private.can_write_group(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM boardgames.groups g
        WHERE g.id = p_group_id
          AND g.status = 'active'
          AND (
              g.is_public = true
              OR EXISTS (
                  SELECT 1
                  FROM boardgames.group_members m
                  WHERE m.group_id = g.id
                    AND m.user_id = (SELECT auth.uid())
                    AND m.role IN ('admin', 'editor')
              )
          )
    );
$$;

-- ============================================================================
-- 2. RLS POLICIES ON `boardgames.*` (InitPlan Subquery Standard)
-- ============================================================================
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'boardgames'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

CREATE POLICY bg_groups_select ON boardgames.groups
    FOR SELECT TO anon, authenticated
    USING ((SELECT boardgames_private.can_read_group(id)));

CREATE POLICY bg_group_members_select ON boardgames.group_members
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()) OR (SELECT boardgames_private.can_read_group(group_id)));

CREATE POLICY bg_user_preferences_own ON boardgames.user_preferences
    FOR ALL TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY bg_games_select ON boardgames.games
    FOR SELECT TO anon, authenticated
    USING ((SELECT boardgames_private.can_read_group(group_id)));

CREATE POLICY bg_games_write ON boardgames.games
    FOR ALL TO authenticated
    USING ((SELECT boardgames_private.can_write_group(group_id)))
    WITH CHECK ((SELECT boardgames_private.can_write_group(group_id)));

CREATE POLICY bg_players_select ON boardgames.players
    FOR SELECT TO anon, authenticated
    USING ((SELECT boardgames_private.can_read_group(group_id)));

CREATE POLICY bg_players_write ON boardgames.players
    FOR ALL TO authenticated
    USING ((SELECT boardgames_private.can_write_group(group_id)))
    WITH CHECK ((SELECT boardgames_private.can_write_group(group_id)));

CREATE POLICY bg_play_sessions_select ON boardgames.play_sessions
    FOR SELECT TO anon, authenticated
    USING ((SELECT boardgames_private.can_read_group(group_id)));

CREATE POLICY bg_play_sessions_write ON boardgames.play_sessions
    FOR ALL TO authenticated
    USING ((SELECT boardgames_private.can_write_group(group_id)))
    WITH CHECK ((SELECT boardgames_private.can_write_group(group_id)));

CREATE POLICY bg_play_session_results_select ON boardgames.play_session_results
    FOR SELECT TO anon, authenticated
    USING ((SELECT boardgames_private.can_read_group(group_id)));

CREATE POLICY bg_play_session_results_write ON boardgames.play_session_results
    FOR ALL TO authenticated
    USING ((SELECT boardgames_private.can_write_group(group_id)))
    WITH CHECK ((SELECT boardgames_private.can_write_group(group_id)));

CREATE POLICY bg_shared_stat_cards_select ON boardgames.shared_stat_cards
    FOR SELECT TO anon, authenticated
    USING (is_public = true OR (SELECT boardgames_private.can_read_group(group_id)));

CREATE POLICY bg_shared_stat_cards_write ON boardgames.shared_stat_cards
    FOR ALL TO authenticated
    USING ((SELECT boardgames_private.can_write_group(group_id)))
    WITH CHECK ((SELECT boardgames_private.can_write_group(group_id)));

CREATE POLICY bg_session_cheers_select ON boardgames.session_cheers
    FOR SELECT TO anon, authenticated
    USING ((SELECT boardgames_private.can_read_group(group_id)));

CREATE POLICY bg_session_cheers_write ON boardgames.session_cheers
    FOR ALL TO authenticated
    USING ((SELECT boardgames_private.can_write_group(group_id)))
    WITH CHECK ((SELECT boardgames_private.can_write_group(group_id)));

-- ============================================================================
-- 3. TWO-TIER `boardgames_private` + `public` `*_v2` RPCs
-- ============================================================================

-- 3A. Workspace / Active Group Resolution (`bg_get_workspace_v2`)
CREATE OR REPLACE FUNCTION boardgames_private.bg_get_workspace_v2()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_active_id uuid := boardgames_private.active_group_id();
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'user_id', v_uid,
        'active_group_id', g.id,
        'active_group_slug', g.slug,
        'active_group_name', g.name,
        'active_group_tagline', g.tagline,
        'active_group_city', g.city,
        'role', COALESCE(
            (SELECT m.role FROM boardgames.group_members m WHERE m.group_id = g.id AND m.user_id = v_uid),
            'editor'
        ),
        'groups', COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'group_id', gr.id,
                        'slug', gr.slug,
                        'name', gr.name,
                        'city', gr.city,
                        'role', COALESCE(gm.role, 'editor')
                    )
                    ORDER BY (gr.id = v_active_id) DESC, gr.name ASC
                )
                FROM boardgames.groups gr
                LEFT JOIN boardgames.group_members gm
                       ON gm.group_id = gr.id AND gm.user_id = v_uid
                WHERE gr.status = 'active'
                  AND (gr.is_public = true OR gm.user_id IS NOT NULL)
            ),
            '[]'::jsonb
        )
    )
    INTO v_result
    FROM boardgames.groups g
    WHERE g.id = v_active_id;

    RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_get_workspace_v2()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT boardgames_private.bg_get_workspace_v2();
$$;

-- 3B. Dashboard Overview & Pushed-Down Rollups (`bg_dashboard_overview_v2`)
CREATE OR REPLACE FUNCTION boardgames_private.bg_dashboard_overview_v2(p_group_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_group_id uuid := COALESCE(p_group_id, boardgames_private.active_group_id());
    v_group jsonb;
    v_kpis jsonb;
    v_champion jsonb;
    v_top_game jsonb;
    v_monthly jsonb;
    v_categories jsonb;
    v_h_index int := 0;
BEGIN
    IF NOT boardgames_private.can_read_group(v_group_id) THEN
        RAISE EXCEPTION 'Access denied to board game group' USING ERRCODE = '42501';
    END IF;

    SELECT jsonb_build_object(
        'id', g.id,
        'slug', g.slug,
        'name', g.name,
        'tagline', g.tagline,
        'city', g.city,
        'accent_color', g.accent_color
    )
    INTO v_group
    FROM boardgames.groups g
    WHERE g.id = v_group_id;

    -- Compute Group H-Index: max H such that at least H games have been played >= H times
    WITH game_play_counts AS (
        SELECT
            s.board_game_id,
            COUNT(*)::int AS plays_count,
            ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC, s.board_game_id) AS rn
        FROM boardgames.play_sessions s
        WHERE s.group_id = v_group_id
        GROUP BY s.board_game_id
    )
    SELECT COALESCE(MAX(rn), 0)::int
    INTO v_h_index
    FROM game_play_counts
    WHERE plays_count >= rn;

    SELECT jsonb_build_object(
        'total_sessions', (SELECT COUNT(*)::int FROM boardgames.play_sessions WHERE group_id = v_group_id),
        'total_hours', COALESCE((SELECT ROUND(SUM(duration_minutes)::numeric / 60.0, 1) FROM boardgames.play_sessions WHERE group_id = v_group_id), 0),
        'unique_games_played', (SELECT COUNT(DISTINCT board_game_id)::int FROM boardgames.play_sessions WHERE group_id = v_group_id),
        'total_games_in_closet', (SELECT COUNT(*)::int FROM boardgames.games WHERE group_id = v_group_id),
        'active_players', (SELECT COUNT(*)::int FROM boardgames.players WHERE group_id = v_group_id),
        'group_h_index', v_h_index,
        'avg_session_minutes', COALESCE((SELECT ROUND(AVG(duration_minutes))::int FROM boardgames.play_sessions WHERE group_id = v_group_id), 0),
        'avg_complexity_weight', COALESCE((
            SELECT ROUND(AVG(gm.complexity_weight), 2)
            FROM boardgames.play_sessions ps
            JOIN boardgames.games gm ON gm.id = ps.board_game_id
            WHERE ps.group_id = v_group_id
        ), 0),
        'total_cheers', COALESCE((SELECT SUM(likes_count)::int FROM boardgames.play_sessions WHERE group_id = v_group_id), 0)
    )
    INTO v_kpis;

    -- Top ELO Champion
    SELECT jsonb_build_object(
        'id', p.id,
        'slug', p.slug,
        'display_name', p.display_name,
        'handle', p.handle,
        'avatar_color', p.avatar_color,
        'elo_rating', p.elo_rating,
        'games_played', COALESCE(stats.games_played, 0),
        'wins_count', COALESCE(stats.wins_count, 0),
        'win_rate', CASE WHEN COALESCE(stats.games_played, 0) > 0
                         THEN ROUND((stats.wins_count::numeric * 100.0) / stats.games_played, 1)
                         ELSE 0 END
    )
    INTO v_champion
    FROM boardgames.players p
    LEFT JOIN LATERAL (
        SELECT
            COUNT(*)::int AS games_played,
            COUNT(*) FILTER (WHERE r.is_winner)::int AS wins_count
        FROM boardgames.play_session_results r
        WHERE r.player_id = p.id
    ) stats ON true
    WHERE p.group_id = v_group_id
    ORDER BY p.elo_rating DESC, stats.wins_count DESC
    LIMIT 1;

    -- Most Played Game
    SELECT jsonb_build_object(
        'id', gm.id,
        'slug', gm.slug,
        'title', gm.title,
        'category', gm.category,
        'complexity_weight', gm.complexity_weight,
        'cover_color', gm.cover_color,
        'plays_count', COALESCE(gstats.plays_count, 0),
        'total_hours', COALESCE(gstats.total_hours, 0)
    )
    INTO v_top_game
    FROM boardgames.games gm
    LEFT JOIN LATERAL (
        SELECT
            COUNT(*)::int AS plays_count,
            ROUND(SUM(s.duration_minutes)::numeric / 60.0, 1) AS total_hours
        FROM boardgames.play_sessions s
        WHERE s.board_game_id = gm.id
    ) gstats ON true
    WHERE gm.group_id = v_group_id
    ORDER BY COALESCE(gstats.plays_count, 0) DESC, gm.title ASC
    LIMIT 1;

    -- Monthly Activity (last 6 months of plays)
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'month_key', m.month_key,
                'month_label', m.month_label,
                'sessions_count', m.sessions_count,
                'hours_played', m.hours_played,
                'unique_games', m.unique_games
            )
            ORDER BY m.month_key ASC
        ),
        '[]'::jsonb
    )
    INTO v_monthly
    FROM (
        SELECT
            to_char(date_trunc('month', s.played_at), 'YYYY-MM') AS month_key,
            to_char(date_trunc('month', s.played_at), 'Mon YYYY') AS month_label,
            COUNT(*)::int AS sessions_count,
            ROUND(SUM(s.duration_minutes)::numeric / 60.0, 1) AS hours_played,
            COUNT(DISTINCT s.board_game_id)::int AS unique_games
        FROM boardgames.play_sessions s
        WHERE s.group_id = v_group_id
        GROUP BY date_trunc('month', s.played_at)
        ORDER BY date_trunc('month', s.played_at) DESC
        LIMIT 6
    ) m;

    -- Category Breakdown
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'category', c.category,
                'games_count', c.games_count,
                'sessions_count', c.sessions_count,
                'hours_played', c.hours_played
            )
            ORDER BY c.sessions_count DESC, c.category ASC
        ),
        '[]'::jsonb
    )
    INTO v_categories
    FROM (
        SELECT
            gm.category,
            COUNT(DISTINCT gm.id)::int AS games_count,
            COUNT(s.id)::int AS sessions_count,
            COALESCE(ROUND(SUM(s.duration_minutes)::numeric / 60.0, 1), 0) AS hours_played
        FROM boardgames.games gm
        LEFT JOIN boardgames.play_sessions s ON s.board_game_id = gm.id
        WHERE gm.group_id = v_group_id
        GROUP BY gm.category
    ) c;

    RETURN jsonb_build_object(
        'group', COALESCE(v_group, '{}'::jsonb),
        'kpis', COALESCE(v_kpis, '{}'::jsonb),
        'champion', COALESCE(v_champion, '{}'::jsonb),
        'top_game', COALESCE(v_top_game, '{}'::jsonb),
        'monthly_activity', v_monthly,
        'category_breakdown', v_categories
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_dashboard_overview_v2(p_group_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT boardgames_private.bg_dashboard_overview_v2(p_group_id);
$$;

-- 3C. Games Catalog with Pushed-Down Rollups (`bg_games_catalog_v2`)
CREATE OR REPLACE FUNCTION boardgames_private.bg_games_catalog_v2(p_group_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_group_id uuid := COALESCE(p_group_id, boardgames_private.active_group_id());
    v_rows jsonb;
BEGIN
    IF NOT boardgames_private.can_read_group(v_group_id) THEN
        RAISE EXCEPTION 'Access denied to board game group' USING ERRCODE = '42501';
    END IF;

    WITH session_rollups AS (
        SELECT
            s.board_game_id,
            COUNT(*)::int AS plays_count,
            ROUND(SUM(s.duration_minutes)::numeric / 60.0, 1) AS total_hours,
            ROUND(AVG(s.duration_minutes))::int AS avg_duration_minutes,
            MAX(s.played_at) AS last_played_at
        FROM boardgames.play_sessions s
        WHERE s.group_id = v_group_id
        GROUP BY s.board_game_id
    ),
    score_rollups AS (
        SELECT
            s.board_game_id,
            ROUND(AVG(r.score), 1) AS avg_score,
            MAX(r.score) AS high_score,
            COUNT(DISTINCT r.player_id)::int AS unique_players_count
        FROM boardgames.play_sessions s
        JOIN boardgames.play_session_results r ON r.session_id = s.id
        WHERE s.group_id = v_group_id
        GROUP BY s.board_game_id
    ),
    high_score_holders AS (
        SELECT DISTINCT ON (s.board_game_id)
            s.board_game_id,
            p.display_name AS high_score_player_name,
            r.score AS top_score
        FROM boardgames.play_sessions s
        JOIN boardgames.play_session_results r ON r.session_id = s.id
        JOIN boardgames.players p ON p.id = r.player_id
        WHERE s.group_id = v_group_id
        ORDER BY s.board_game_id, r.score DESC, s.played_at DESC
    ),
    game_champions AS (
        SELECT DISTINCT ON (w.board_game_id)
            w.board_game_id,
            w.display_name AS reigning_champion_name,
            w.wins_count AS champion_wins
        FROM (
            SELECT
                s.board_game_id,
                p.display_name,
                COUNT(*) FILTER (WHERE r.is_winner)::int AS wins_count
            FROM boardgames.play_sessions s
            JOIN boardgames.play_session_results r ON r.session_id = s.id
            JOIN boardgames.players p ON p.id = r.player_id
            WHERE s.group_id = v_group_id
            GROUP BY s.board_game_id, p.id, p.display_name
        ) w
        WHERE w.wins_count > 0
        ORDER BY w.board_game_id, w.wins_count DESC, w.display_name ASC
    )
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', gm.id,
                'group_id', gm.group_id,
                'slug', gm.slug,
                'title', gm.title,
                'subtitle', gm.subtitle,
                'designer', gm.designer,
                'publisher', gm.publisher,
                'release_year', gm.release_year,
                'min_players', gm.min_players,
                'max_players', gm.max_players,
                'min_playtime_minutes', gm.min_playtime_minutes,
                'max_playtime_minutes', gm.max_playtime_minutes,
                'complexity_weight', gm.complexity_weight,
                'category', gm.category,
                'scoring_mode', gm.scoring_mode,
                'cover_color', gm.cover_color,
                'bgg_rank', gm.bgg_rank,
                'is_favorite', gm.is_favorite,
                'plays_count', COALESCE(sr.plays_count, 0),
                'total_hours', COALESCE(sr.total_hours, 0),
                'avg_duration_minutes', COALESCE(sr.avg_duration_minutes, gm.max_playtime_minutes),
                'last_played_at', sr.last_played_at,
                'avg_score', COALESCE(scr.avg_score, 0),
                'high_score', COALESCE(scr.high_score, 0),
                'high_score_player_name', hsh.high_score_player_name,
                'reigning_champion_name', gc.reigning_champion_name,
                'champion_wins', COALESCE(gc.champion_wins, 0),
                'unique_players_count', COALESCE(scr.unique_players_count, 0)
            )
            ORDER BY COALESCE(sr.plays_count, 0) DESC, gm.title ASC
        ),
        '[]'::jsonb
    )
    INTO v_rows
    FROM boardgames.games gm
    LEFT JOIN session_rollups sr ON sr.board_game_id = gm.id
    LEFT JOIN score_rollups scr ON scr.board_game_id = gm.id
    LEFT JOIN high_score_holders hsh ON hsh.board_game_id = gm.id
    LEFT JOIN game_champions gc ON gc.board_game_id = gm.id
    WHERE gm.group_id = v_group_id;

    RETURN v_rows;
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_games_catalog_v2(p_group_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT boardgames_private.bg_games_catalog_v2(p_group_id);
$$;

-- 3D. Players Leaderboard with ELO, Win Rate & H-Index (`bg_players_leaderboard_v2`)
CREATE OR REPLACE FUNCTION boardgames_private.bg_players_leaderboard_v2(p_group_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_group_id uuid := COALESCE(p_group_id, boardgames_private.active_group_id());
    v_rows jsonb;
BEGIN
    IF NOT boardgames_private.can_read_group(v_group_id) THEN
        RAISE EXCEPTION 'Access denied to board game group' USING ERRCODE = '42501';
    END IF;

    WITH player_stats AS (
        SELECT
            r.player_id,
            COUNT(*)::int AS games_played,
            COUNT(*) FILTER (WHERE r.is_winner)::int AS wins_count,
            COUNT(*) FILTER (WHERE r.placement <= 3)::int AS podium_count,
            ROUND(AVG(r.placement), 2) AS avg_placement,
            ROUND(SUM(s.duration_minutes)::numeric / 60.0, 1) AS total_hours,
            MAX(r.score) AS best_score,
            SUM(r.elo_delta)::int AS elo_delta_total
        FROM boardgames.play_session_results r
        JOIN boardgames.play_sessions s ON s.id = r.session_id
        WHERE r.group_id = v_group_id
        GROUP BY r.player_id
    ),
    player_signature_game AS (
        SELECT DISTINCT ON (pg.player_id)
            pg.player_id,
            pg.title AS signature_game_title,
            pg.plays_count AS signature_game_plays
        FROM (
            SELECT
                r.player_id,
                gm.title,
                COUNT(*)::int AS plays_count,
                COUNT(*) FILTER (WHERE r.is_winner)::int AS wins_count
            FROM boardgames.play_session_results r
            JOIN boardgames.play_sessions s ON s.id = r.session_id
            JOIN boardgames.games gm ON gm.id = s.board_game_id
            WHERE r.group_id = v_group_id
            GROUP BY r.player_id, gm.id, gm.title
        ) pg
        ORDER BY pg.player_id, pg.wins_count DESC, pg.plays_count DESC, pg.title ASC
    ),
    player_h_indices AS (
        SELECT
            ranked.player_id,
            COALESCE(MAX(ranked.rn) FILTER (WHERE ranked.plays_count >= ranked.rn), 0)::int AS player_h_index
        FROM (
            SELECT
                r.player_id,
                s.board_game_id,
                COUNT(*)::int AS plays_count,
                ROW_NUMBER() OVER (PARTITION BY r.player_id ORDER BY COUNT(*) DESC, s.board_game_id) AS rn
            FROM boardgames.play_session_results r
            JOIN boardgames.play_sessions s ON s.id = r.session_id
            WHERE r.group_id = v_group_id
            GROUP BY r.player_id, s.board_game_id
        ) ranked
        GROUP BY ranked.player_id
    )
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', p.id,
                'group_id', p.group_id,
                'slug', p.slug,
                'display_name', p.display_name,
                'handle', p.handle,
                'avatar_color', p.avatar_color,
                'tagline', p.tagline,
                'favorite_category', p.favorite_category,
                'elo_rating', p.elo_rating,
                'is_guest', p.is_guest,
                'games_played', COALESCE(ps.games_played, 0),
                'wins_count', COALESCE(ps.wins_count, 0),
                'podium_count', COALESCE(ps.podium_count, 0),
                'win_rate', CASE WHEN COALESCE(ps.games_played, 0) > 0
                                 THEN ROUND((ps.wins_count::numeric * 100.0) / ps.games_played, 1)
                                 ELSE 0 END,
                'podium_rate', CASE WHEN COALESCE(ps.games_played, 0) > 0
                                    THEN ROUND((ps.podium_count::numeric * 100.0) / ps.games_played, 1)
                                    ELSE 0 END,
                'avg_placement', COALESCE(ps.avg_placement, 0),
                'total_hours', COALESCE(ps.total_hours, 0),
                'best_score', COALESCE(ps.best_score, 0),
                'elo_delta_total', COALESCE(ps.elo_delta_total, 0),
                'player_h_index', COALESCE(phi.player_h_index, 0),
                'signature_game_title', COALESCE(psg.signature_game_title, 'Unranked')
            )
            ORDER BY p.elo_rating DESC, COALESCE(ps.wins_count, 0) DESC, p.display_name ASC
        ),
        '[]'::jsonb
    )
    INTO v_rows
    FROM boardgames.players p
    LEFT JOIN player_stats ps ON ps.player_id = p.id
    LEFT JOIN player_signature_game psg ON psg.player_id = p.id
    LEFT JOIN player_h_indices phi ON phi.player_id = p.id
    WHERE p.group_id = v_group_id;

    RETURN v_rows;
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_players_leaderboard_v2(p_group_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT boardgames_private.bg_players_leaderboard_v2(p_group_id);
$$;

-- 3E. Sessions Feed with Pre-Aggregated Results & Cheers (`bg_sessions_feed_v2`)
CREATE OR REPLACE FUNCTION boardgames_private.bg_sessions_feed_v2(
    p_group_id uuid DEFAULT NULL,
    p_limit int DEFAULT 50,
    p_game_slug text DEFAULT NULL,
    p_player_slug text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_group_id uuid := COALESCE(p_group_id, boardgames_private.active_group_id());
    v_bounded_limit int := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
    v_rows jsonb;
BEGIN
    IF NOT boardgames_private.can_read_group(v_group_id) THEN
        RAISE EXCEPTION 'Access denied to board game group' USING ERRCODE = '42501';
    END IF;

    -- Paginate lightweight session IDs first before enriching (per supabase/AGENTS.md Rule 3)
    WITH target_sessions AS (
        SELECT s.id
        FROM boardgames.play_sessions s
        JOIN boardgames.games gm ON gm.id = s.board_game_id
        WHERE s.group_id = v_group_id
          AND (p_game_slug IS NULL OR gm.slug = p_game_slug)
          AND (
              p_player_slug IS NULL
              OR EXISTS (
                  SELECT 1
                  FROM boardgames.play_session_results r
                  JOIN boardgames.players p ON p.id = r.player_id
                  WHERE r.session_id = s.id AND p.slug = p_player_slug
              )
          )
        ORDER BY s.played_at DESC, s.created_at DESC
        LIMIT v_bounded_limit
    ),
    results_by_session AS (
        SELECT
            r.session_id,
            jsonb_agg(
                jsonb_build_object(
                    'id', r.id,
                    'player_id', p.id,
                    'player_slug', p.slug,
                    'player_name', p.display_name,
                    'player_handle', p.handle,
                    'avatar_color', p.avatar_color,
                    'faction_or_role', r.faction_or_role,
                    'score', r.score,
                    'placement', r.placement,
                    'is_winner', r.is_winner,
                    'is_new_player', r.is_new_player,
                    'elo_delta', r.elo_delta,
                    'score_breakdown', r.score_breakdown
                )
                ORDER BY r.placement ASC, r.score DESC
            ) AS results_json
        FROM boardgames.play_session_results r
        JOIN target_sessions ts ON ts.id = r.session_id
        JOIN boardgames.players p ON p.id = r.player_id
        GROUP BY r.session_id
    ),
    cheers_by_session AS (
        SELECT
            c.session_id,
            COUNT(*)::int AS cheers_count,
            jsonb_agg(
                jsonb_build_object(
                    'id', c.id,
                    'reactor_name', c.reactor_name,
                    'reaction_type', c.reaction_type,
                    'comment_text', c.comment_text,
                    'created_at', c.created_at
                )
                ORDER BY c.created_at DESC
            ) AS cheers_json
        FROM boardgames.session_cheers c
        JOIN target_sessions ts ON ts.id = c.session_id
        GROUP BY c.session_id
    )
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', s.id,
                'group_id', s.group_id,
                'share_slug', s.share_slug,
                'played_at', s.played_at,
                'duration_minutes', s.duration_minutes,
                'location', s.location,
                'session_title', s.session_title,
                'session_notes', s.session_notes,
                'highlight_moment', s.highlight_moment,
                'is_cooperative_win', s.is_cooperative_win,
                'is_first_play_for_group', s.is_first_play_for_group,
                'likes_count', s.likes_count,
                'game', jsonb_build_object(
                    'id', gm.id,
                    'slug', gm.slug,
                    'title', gm.title,
                    'category', gm.category,
                    'complexity_weight', gm.complexity_weight,
                    'cover_color', gm.cover_color,
                    'scoring_mode', gm.scoring_mode
                ),
                'results', COALESCE(rbs.results_json, '[]'::jsonb),
                'cheers_count', COALESCE(cbs.cheers_count, 0),
                'cheers', COALESCE(cbs.cheers_json, '[]'::jsonb)
            )
            ORDER BY s.played_at DESC, s.created_at DESC
        ),
        '[]'::jsonb
    )
    INTO v_rows
    FROM target_sessions ts
    JOIN boardgames.play_sessions s ON s.id = ts.id
    JOIN boardgames.games gm ON gm.id = s.board_game_id
    LEFT JOIN results_by_session rbs ON rbs.session_id = s.id
    LEFT JOIN cheers_by_session cbs ON cbs.session_id = s.id;

    RETURN v_rows;
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_sessions_feed_v2(
    p_group_id uuid DEFAULT NULL,
    p_limit int DEFAULT 50,
    p_game_slug text DEFAULT NULL,
    p_player_slug text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT boardgames_private.bg_sessions_feed_v2(p_group_id, p_limit, p_game_slug, p_player_slug);
$$;

-- 3F. Head-to-Head Rivalry Comparison (`bg_head_to_head_v2`)
CREATE OR REPLACE FUNCTION boardgames_private.bg_head_to_head_v2(
    p_group_id uuid,
    p_player_a_id uuid,
    p_player_b_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_group_id uuid := COALESCE(p_group_id, boardgames_private.active_group_id());
    v_summary jsonb;
    v_by_game jsonb;
BEGIN
    IF NOT boardgames_private.can_read_group(v_group_id) THEN
        RAISE EXCEPTION 'Access denied to board game group' USING ERRCODE = '42501';
    END IF;

    WITH shared AS (
        SELECT
            s.id AS session_id,
            s.board_game_id,
            s.played_at,
            ra.score AS score_a,
            ra.placement AS placement_a,
            ra.is_winner AS winner_a,
            rb.score AS score_b,
            rb.placement AS placement_b,
            rb.is_winner AS winner_b
        FROM boardgames.play_sessions s
        JOIN boardgames.play_session_results ra
             ON ra.session_id = s.id AND ra.player_id = p_player_a_id
        JOIN boardgames.play_session_results rb
             ON rb.session_id = s.id AND rb.player_id = p_player_b_id
        WHERE s.group_id = v_group_id
    )
    SELECT jsonb_build_object(
        'shared_sessions_count', COUNT(*)::int,
        'player_a_wins', COUNT(*) FILTER (WHERE winner_a)::int,
        'player_b_wins', COUNT(*) FILTER (WHERE winner_b)::int,
        'player_a_better_finishes', COUNT(*) FILTER (WHERE placement_a < placement_b)::int,
        'player_b_better_finishes', COUNT(*) FILTER (WHERE placement_b < placement_a)::int,
        'ties_count', COUNT(*) FILTER (WHERE placement_a = placement_b)::int,
        'player_a_avg_placement', COALESCE(ROUND(AVG(placement_a), 2), 0),
        'player_b_avg_placement', COALESCE(ROUND(AVG(placement_b), 2), 0),
        'player_a_avg_score', COALESCE(ROUND(AVG(score_a), 1), 0),
        'player_b_avg_score', COALESCE(ROUND(AVG(score_b), 1), 0)
    )
    INTO v_summary
    FROM shared;

    WITH shared_by_game AS (
        SELECT
            gm.id AS game_id,
            gm.slug AS game_slug,
            gm.title AS game_title,
            gm.cover_color,
            COUNT(*)::int AS shared_plays,
            COUNT(*) FILTER (WHERE ra.placement < rb.placement)::int AS a_outplaced_b,
            COUNT(*) FILTER (WHERE rb.placement < ra.placement)::int AS b_outplaced_a,
            ROUND(AVG(ra.score), 1) AS a_avg_score,
            ROUND(AVG(rb.score), 1) AS b_avg_score
        FROM boardgames.play_sessions s
        JOIN boardgames.games gm ON gm.id = s.board_game_id
        JOIN boardgames.play_session_results ra
             ON ra.session_id = s.id AND ra.player_id = p_player_a_id
        JOIN boardgames.play_session_results rb
             ON rb.session_id = s.id AND rb.player_id = p_player_b_id
        WHERE s.group_id = v_group_id
        GROUP BY gm.id, gm.slug, gm.title, gm.cover_color
    )
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'game_id', game_id,
                'game_slug', game_slug,
                'game_title', game_title,
                'cover_color', cover_color,
                'shared_plays', shared_plays,
                'a_outplaced_b', a_outplaced_b,
                'b_outplaced_a', b_outplaced_a,
                'a_avg_score', a_avg_score,
                'b_avg_score', b_avg_score
            )
            ORDER BY shared_plays DESC, game_title ASC
        ),
        '[]'::jsonb
    )
    INTO v_by_game
    FROM shared_by_game;

    RETURN jsonb_build_object(
        'summary', COALESCE(v_summary, '{}'::jsonb),
        'by_game', v_by_game
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_head_to_head_v2(
    p_group_id uuid,
    p_player_a_id uuid,
    p_player_b_id uuid
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT boardgames_private.bg_head_to_head_v2(p_group_id, p_player_a_id, p_player_b_id);
$$;

-- 3G. Shared Stat Cards List & Public Card Resolution (`bg_shared_cards_v2`, `bg_public_share_card_v2`)
CREATE OR REPLACE FUNCTION boardgames_private.bg_shared_cards_v2(p_group_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_group_id uuid := COALESCE(p_group_id, boardgames_private.active_group_id());
    v_rows jsonb;
BEGIN
    IF NOT boardgames_private.can_read_group(v_group_id) THEN
        RAISE EXCEPTION 'Access denied to board game group' USING ERRCODE = '42501';
    END IF;

    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', c.id,
                'group_id', c.group_id,
                'share_code', c.share_code,
                'card_type', c.card_type,
                'title', c.title,
                'subtitle', c.subtitle,
                'theme_preset', c.theme_preset,
                'session_id', c.session_id,
                'player_id', c.player_id,
                'board_game_id', c.board_game_id,
                'snapshot_payload', c.snapshot_payload,
                'cheers_count', c.cheers_count,
                'views_count', c.views_count,
                'created_at', c.created_at
            )
            ORDER BY c.created_at DESC
        ),
        '[]'::jsonb
    )
    INTO v_rows
    FROM boardgames.shared_stat_cards c
    WHERE c.group_id = v_group_id;

    RETURN v_rows;
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_shared_cards_v2(p_group_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT boardgames_private.bg_shared_cards_v2(p_group_id);
$$;

CREATE OR REPLACE FUNCTION boardgames_private.bg_public_share_card_v2(p_share_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_card jsonb;
BEGIN
    SELECT jsonb_build_object(
        'id', c.id,
        'group_id', c.group_id,
        'group_name', g.name,
        'group_city', g.city,
        'share_code', c.share_code,
        'card_type', c.card_type,
        'title', c.title,
        'subtitle', c.subtitle,
        'theme_preset', c.theme_preset,
        'session_id', c.session_id,
        'player_id', c.player_id,
        'board_game_id', c.board_game_id,
        'snapshot_payload', c.snapshot_payload,
        'cheers_count', c.cheers_count,
        'views_count', c.views_count,
        'created_at', c.created_at
    )
    INTO v_card
    FROM boardgames.shared_stat_cards c
    JOIN boardgames.groups g ON g.id = c.group_id
    WHERE (c.share_code = p_share_code OR c.id::text = p_share_code)
      AND c.is_public = true
    LIMIT 1;

    IF v_card IS NOT NULL THEN
        RETURN v_card;
    END IF;

    -- Fallback: check if `p_share_code` matches a `play_sessions.share_slug`
    SELECT jsonb_build_object(
        'id', s.id,
        'group_id', s.group_id,
        'group_name', g.name,
        'group_city', g.city,
        'share_code', s.share_slug,
        'card_type', 'session_recap',
        'title', COALESCE(NULLIF(s.session_title, ''), gm.title || ' Match Night'),
        'subtitle', gm.title || ' • ' || s.location || ' • ' || s.duration_minutes || ' min',
        'theme_preset', 'midnight-gold',
        'session_id', s.id,
        'player_id', NULL,
        'board_game_id', gm.id,
        'snapshot_payload', jsonb_build_object(
            'game_title', gm.title,
            'category', gm.category,
            'complexity_weight', gm.complexity_weight,
            'played_at', s.played_at,
            'duration_minutes', s.duration_minutes,
            'location', s.location,
            'highlight_moment', s.highlight_moment,
            'session_notes', s.session_notes,
            'results', COALESCE((
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'player_name', p.display_name,
                        'player_handle', p.handle,
                        'avatar_color', p.avatar_color,
                        'faction_or_role', r.faction_or_role,
                        'score', r.score,
                        'placement', r.placement,
                        'is_winner', r.is_winner,
                        'elo_delta', r.elo_delta
                    )
                    ORDER BY r.placement ASC, r.score DESC
                )
                FROM boardgames.play_session_results r
                JOIN boardgames.players p ON p.id = r.player_id
                WHERE r.session_id = s.id
            ), '[]'::jsonb)
        ),
        'cheers_count', s.likes_count,
        'views_count', 1,
        'created_at', s.created_at
    )
    INTO v_card
    FROM boardgames.play_sessions s
    JOIN boardgames.groups g ON g.id = s.group_id
    JOIN boardgames.games gm ON gm.id = s.board_game_id
    WHERE s.share_slug = p_share_code
      AND s.is_public_shared = true
    LIMIT 1;

    RETURN v_card;
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_public_share_card_v2(p_share_code text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT boardgames_private.bg_public_share_card_v2(p_share_code);
$$;

-- ============================================================================
-- 4. WRITE RPCs (`bg_create_game_v2`, `bg_create_player_v2`, `bg_log_session_v2`, `bg_cheer_session_v2`, `bg_create_share_card_v2`)
-- ============================================================================

CREATE OR REPLACE FUNCTION boardgames_private.bg_create_game_v2(
    p_group_id uuid,
    p_title text,
    p_subtitle text,
    p_designer text,
    p_publisher text,
    p_release_year int,
    p_min_players int,
    p_max_players int,
    p_min_playtime_minutes int,
    p_max_playtime_minutes int,
    p_complexity_weight numeric,
    p_category text,
    p_scoring_mode text,
    p_cover_color text,
    p_bgg_rank int DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_group_id uuid := COALESCE(p_group_id, boardgames_private.active_group_id());
    v_slug text;
    v_game boardgames.games;
BEGIN
    IF NOT boardgames_private.can_write_group(v_group_id) THEN
        RAISE EXCEPTION 'Access denied to add board game' USING ERRCODE = '42501';
    END IF;

    v_slug := lower(regexp_replace(trim(p_title), '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := regexp_replace(v_slug, '^-+|-+$', '', 'g');
    IF v_slug = '' THEN
        v_slug := 'game-' || substr(gen_random_uuid()::text, 1, 8);
    END IF;

    IF EXISTS (SELECT 1 FROM boardgames.games WHERE group_id = v_group_id AND slug = v_slug) THEN
        v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 4);
    END IF;

    INSERT INTO boardgames.games (
        group_id, slug, title, subtitle, designer, publisher, release_year,
        min_players, max_players, min_playtime_minutes, max_playtime_minutes,
        complexity_weight, category, scoring_mode, cover_color, bgg_rank
    )
    VALUES (
        v_group_id, v_slug, trim(p_title), COALESCE(trim(p_subtitle), ''),
        COALESCE(trim(p_designer), ''), COALESCE(trim(p_publisher), ''),
        COALESCE(p_release_year, 2024), GREATEST(COALESCE(p_min_players, 1), 1),
        GREATEST(COALESCE(p_max_players, 4), GREATEST(COALESCE(p_min_players, 1), 1)),
        GREATEST(COALESCE(p_min_playtime_minutes, 30), 5),
        GREATEST(COALESCE(p_max_playtime_minutes, 90), GREATEST(COALESCE(p_min_playtime_minutes, 30), 5)),
        LEAST(GREATEST(COALESCE(p_complexity_weight, 2.50), 1.00), 5.00),
        COALESCE(NULLIF(trim(p_category), ''), 'Strategy'),
        COALESCE(NULLIF(trim(p_scoring_mode), ''), 'highest_wins'),
        COALESCE(NULLIF(trim(p_cover_color), ''), '#A48DFF'),
        p_bgg_rank
    )
    RETURNING * INTO v_game;

    RETURN to_jsonb(v_game);
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_create_game_v2(
    p_group_id uuid,
    p_title text,
    p_subtitle text,
    p_designer text,
    p_publisher text,
    p_release_year int,
    p_min_players int,
    p_max_players int,
    p_min_playtime_minutes int,
    p_max_playtime_minutes int,
    p_complexity_weight numeric,
    p_category text,
    p_scoring_mode text,
    p_cover_color text,
    p_bgg_rank int DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
VOLATILE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT boardgames_private.bg_create_game_v2(
        p_group_id, p_title, p_subtitle, p_designer, p_publisher, p_release_year,
        p_min_players, p_max_players, p_min_playtime_minutes, p_max_playtime_minutes,
        p_complexity_weight, p_category, p_scoring_mode, p_cover_color, p_bgg_rank
    );
$$;

CREATE OR REPLACE FUNCTION boardgames_private.bg_create_player_v2(
    p_group_id uuid,
    p_display_name text,
    p_handle text,
    p_tagline text,
    p_favorite_category text,
    p_avatar_color text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_group_id uuid := COALESCE(p_group_id, boardgames_private.active_group_id());
    v_slug text;
    v_handle text;
    v_player boardgames.players;
BEGIN
    IF NOT boardgames_private.can_write_group(v_group_id) THEN
        RAISE EXCEPTION 'Access denied to add player' USING ERRCODE = '42501';
    END IF;

    v_slug := lower(regexp_replace(trim(p_display_name), '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := regexp_replace(v_slug, '^-+|-+$', '', 'g');
    IF v_slug = '' THEN
        v_slug := 'player-' || substr(gen_random_uuid()::text, 1, 8);
    END IF;

    IF EXISTS (SELECT 1 FROM boardgames.players WHERE group_id = v_group_id AND slug = v_slug) THEN
        v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 4);
    END IF;

    v_handle := COALESCE(NULLIF(trim(p_handle), ''), '@' || replace(v_slug, '-', '_'));
    IF left(v_handle, 1) <> '@' THEN
        v_handle := '@' || v_handle;
    END IF;

    INSERT INTO boardgames.players (
        group_id, slug, display_name, handle, tagline, favorite_category, avatar_color
    )
    VALUES (
        v_group_id, v_slug, trim(p_display_name), v_handle,
        COALESCE(trim(p_tagline), ''),
        COALESCE(NULLIF(trim(p_favorite_category), ''), 'Strategy'),
        COALESCE(NULLIF(trim(p_avatar_color), ''), '#A48DFF')
    )
    RETURNING * INTO v_player;

    RETURN to_jsonb(v_player);
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_create_player_v2(
    p_group_id uuid,
    p_display_name text,
    p_handle text,
    p_tagline text,
    p_favorite_category text,
    p_avatar_color text
)
RETURNS jsonb
LANGUAGE sql
VOLATILE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT boardgames_private.bg_create_player_v2(
        p_group_id, p_display_name, p_handle, p_tagline, p_favorite_category, p_avatar_color
    );
$$;

-- Log a play session, compute placements + ELO deltas, and generate a shareable recap card
CREATE OR REPLACE FUNCTION boardgames_private.bg_log_session_v2(
    p_group_id uuid,
    p_board_game_id uuid,
    p_played_at timestamptz,
    p_duration_minutes int,
    p_location text,
    p_session_title text,
    p_session_notes text,
    p_highlight_moment text,
    p_is_first_play boolean,
    p_results jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_group_id uuid := COALESCE(p_group_id, boardgames_private.active_group_id());
    v_game boardgames.games;
    v_session_id uuid := gen_random_uuid();
    v_share_slug text;
    v_total_players int;
    v_rec record;
BEGIN
    IF NOT boardgames_private.can_write_group(v_group_id) THEN
        RAISE EXCEPTION 'Access denied to log session' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_game
    FROM boardgames.games
    WHERE id = p_board_game_id AND group_id = v_group_id;

    IF v_game.id IS NULL THEN
        RAISE EXCEPTION 'Board game not found in active group' USING ERRCODE = '22023';
    END IF;

    v_share_slug := v_game.slug || '-' || to_char(COALESCE(p_played_at, now()), 'YYYYMMDD') || '-' || substr(v_session_id::text, 1, 6);

    INSERT INTO boardgames.play_sessions (
        id, group_id, board_game_id, share_slug, played_at, duration_minutes,
        location, session_title, session_notes, highlight_moment,
        is_first_play_for_group, is_public_shared, created_by
    )
    VALUES (
        v_session_id, v_group_id, v_game.id, v_share_slug,
        COALESCE(p_played_at, now()),
        GREATEST(COALESCE(p_duration_minutes, 60), 5),
        COALESCE(NULLIF(trim(p_location), ''), 'Home Table'),
        COALESCE(NULLIF(trim(p_session_title), ''), v_game.title || ' Table Night'),
        COALESCE(trim(p_session_notes), ''),
        COALESCE(trim(p_highlight_moment), ''),
        COALESCE(p_is_first_play, false),
        true,
        (SELECT auth.uid())
    );

    SELECT COUNT(*)::int INTO v_total_players
    FROM jsonb_array_elements(p_results);

    FOR v_rec IN
        WITH parsed AS (
            SELECT
                (elem ->> 'player_id')::uuid AS player_id,
                COALESCE((elem ->> 'score')::numeric, 0) AS score,
                COALESCE(elem ->> 'faction_or_role', '') AS faction_or_role,
                COALESCE((elem ->> 'is_new_player')::boolean, false) AS is_new_player
            FROM jsonb_array_elements(p_results) AS elem
        ),
        ranked AS (
            SELECT
                p.*,
                CASE
                    WHEN v_game.scoring_mode = 'lowest_wins' THEN
                        DENSE_RANK() OVER (ORDER BY p.score ASC)::int
                    ELSE
                        DENSE_RANK() OVER (ORDER BY p.score DESC)::int
                END AS computed_placement
            FROM parsed p
        )
        SELECT
            r.player_id,
            r.score,
            r.faction_or_role,
            r.is_new_player,
            r.computed_placement,
            (r.computed_placement = 1) AS is_winner,
            CASE
                WHEN v_total_players <= 1 THEN 8
                WHEN r.computed_placement = 1 THEN 18 + (v_total_players * 2)
                WHEN r.computed_placement = 2 THEN 6
                WHEN r.computed_placement = v_total_players THEN -14
                ELSE -4
            END AS elo_delta
        FROM ranked r
    LOOP
        INSERT INTO boardgames.play_session_results (
            group_id, session_id, player_id, faction_or_role, score,
            placement, is_winner, is_new_player, elo_delta
        )
        VALUES (
            v_group_id, v_session_id, v_rec.player_id, v_rec.faction_or_role,
            v_rec.score, v_rec.computed_placement, v_rec.is_winner,
            v_rec.is_new_player, v_rec.elo_delta
        );

        UPDATE boardgames.players
           SET elo_rating = GREATEST(800, elo_rating + v_rec.elo_delta)
         WHERE id = v_rec.player_id AND group_id = v_group_id;
    END LOOP;

    -- Auto-create a shareable stat card for the logged match
    INSERT INTO boardgames.shared_stat_cards (
        group_id, share_code, card_type, title, subtitle,
        theme_preset, session_id, board_game_id, snapshot_payload
    )
    VALUES (
        v_group_id,
        v_share_slug,
        'session_recap',
        COALESCE(NULLIF(trim(p_session_title), ''), v_game.title || ' Match Recap'),
        v_game.title || ' • ' || COALESCE(NULLIF(trim(p_location), ''), 'Home Table') || ' • ' || GREATEST(COALESCE(p_duration_minutes, 60), 5) || ' min',
        'midnight-gold',
        v_session_id,
        v_game.id,
        boardgames_private.bg_public_share_card_v2(v_share_slug) -> 'snapshot_payload'
    )
    ON CONFLICT (share_code) DO NOTHING;

    RETURN jsonb_build_object(
        'session_id', v_session_id,
        'share_slug', v_share_slug
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_log_session_v2(
    p_group_id uuid,
    p_board_game_id uuid,
    p_played_at timestamptz,
    p_duration_minutes int,
    p_location text,
    p_session_title text,
    p_session_notes text,
    p_highlight_moment text,
    p_is_first_play boolean,
    p_results jsonb
)
RETURNS jsonb
LANGUAGE sql
VOLATILE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT boardgames_private.bg_log_session_v2(
        p_group_id, p_board_game_id, p_played_at, p_duration_minutes, p_location,
        p_session_title, p_session_notes, p_highlight_moment, p_is_first_play, p_results
    );
$$;

-- Cheer / React to a play session (`bg_cheer_session_v2`)
CREATE OR REPLACE FUNCTION boardgames_private.bg_cheer_session_v2(
    p_session_id uuid,
    p_reactor_name text DEFAULT 'Tabletop Fan',
    p_reaction_type text DEFAULT 'trophy',
    p_comment_text text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_session boardgames.play_sessions;
    v_new_likes int;
BEGIN
    SELECT * INTO v_session
    FROM boardgames.play_sessions
    WHERE id = p_session_id;

    IF v_session.id IS NULL THEN
        RAISE EXCEPTION 'Play session not found' USING ERRCODE = '22023';
    END IF;

    INSERT INTO boardgames.session_cheers (
        group_id, session_id, reactor_name, reaction_type, comment_text
    )
    VALUES (
        v_session.group_id,
        v_session.id,
        COALESCE(NULLIF(trim(p_reactor_name), ''), 'Tabletop Fan'),
        CASE WHEN p_reaction_type IN ('trophy', 'fire', 'dice', 'mindblown') THEN p_reaction_type ELSE 'trophy' END,
        COALESCE(trim(p_comment_text), '')
    );

    UPDATE boardgames.play_sessions
       SET likes_count = likes_count + 1
     WHERE id = v_session.id
    RETURNING likes_count INTO v_new_likes;

    UPDATE boardgames.shared_stat_cards
       SET cheers_count = cheers_count + 1
     WHERE session_id = v_session.id;

    RETURN jsonb_build_object(
        'session_id', v_session.id,
        'likes_count', v_new_likes
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_cheer_session_v2(
    p_session_id uuid,
    p_reactor_name text DEFAULT 'Tabletop Fan',
    p_reaction_type text DEFAULT 'trophy',
    p_comment_text text DEFAULT ''
)
RETURNS jsonb
LANGUAGE sql
VOLATILE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT boardgames_private.bg_cheer_session_v2(
        p_session_id, p_reactor_name, p_reaction_type, p_comment_text
    );
$$;

-- Create a custom Shareable Stat Card (`bg_create_share_card_v2`)
CREATE OR REPLACE FUNCTION boardgames_private.bg_create_share_card_v2(
    p_group_id uuid,
    p_card_type text,
    p_title text,
    p_subtitle text,
    p_theme_preset text,
    p_session_id uuid DEFAULT NULL,
    p_player_id uuid DEFAULT NULL,
    p_board_game_id uuid DEFAULT NULL,
    p_snapshot_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_group_id uuid := COALESCE(p_group_id, boardgames_private.active_group_id());
    v_share_code text;
    v_card boardgames.shared_stat_cards;
BEGIN
    IF NOT boardgames_private.can_write_group(v_group_id) THEN
        RAISE EXCEPTION 'Access denied to create share card' USING ERRCODE = '42501';
    END IF;

    v_share_code := lower(regexp_replace(trim(p_title), '[^a-zA-Z0-9]+', '-', 'g'));
    v_share_code := substr(regexp_replace(v_share_code, '^-+|-+$', '', 'g'), 1, 28)
                    || '-' || substr(gen_random_uuid()::text, 1, 6);

    INSERT INTO boardgames.shared_stat_cards (
        group_id, share_code, card_type, title, subtitle, theme_preset,
        session_id, player_id, board_game_id, snapshot_payload, is_public
    )
    VALUES (
        v_group_id,
        v_share_code,
        CASE WHEN p_card_type IN ('session_recap', 'player_spotlight', 'group_season', 'game_mastery', 'rivalry_head_to_head')
             THEN p_card_type ELSE 'group_season' END,
        trim(p_title),
        COALESCE(trim(p_subtitle), ''),
        COALESCE(NULLIF(trim(p_theme_preset), ''), 'midnight-gold'),
        p_session_id,
        p_player_id,
        p_board_game_id,
        COALESCE(p_snapshot_payload, '{}'::jsonb),
        true
    )
    RETURNING * INTO v_card;

    RETURN to_jsonb(v_card);
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_create_share_card_v2(
    p_group_id uuid,
    p_card_type text,
    p_title text,
    p_subtitle text,
    p_theme_preset text,
    p_session_id uuid DEFAULT NULL,
    p_player_id uuid DEFAULT NULL,
    p_board_game_id uuid DEFAULT NULL,
    p_snapshot_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE sql
VOLATILE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT boardgames_private.bg_create_share_card_v2(
        p_group_id, p_card_type, p_title, p_subtitle, p_theme_preset,
        p_session_id, p_player_id, p_board_game_id, p_snapshot_payload
    );
$$;

-- Lock down permissions on `boardgames_private` and `public.bg_*_v2`
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA boardgames_private FROM PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA boardgames_private TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION
    public.bg_get_workspace_v2(),
    public.bg_dashboard_overview_v2(uuid),
    public.bg_games_catalog_v2(uuid),
    public.bg_players_leaderboard_v2(uuid),
    public.bg_sessions_feed_v2(uuid, int, text, text),
    public.bg_head_to_head_v2(uuid, uuid, uuid),
    public.bg_shared_cards_v2(uuid),
    public.bg_public_share_card_v2(text),
    public.bg_create_game_v2(uuid, text, text, text, text, int, int, int, int, int, numeric, text, text, text, int),
    public.bg_create_player_v2(uuid, text, text, text, text, text),
    public.bg_log_session_v2(uuid, uuid, timestamptz, int, text, text, text, text, boolean, jsonb),
    public.bg_cheer_session_v2(uuid, text, text, text),
    public.bg_create_share_card_v2(uuid, text, text, text, text, uuid, uuid, uuid, jsonb)
TO anon, authenticated, service_role;
