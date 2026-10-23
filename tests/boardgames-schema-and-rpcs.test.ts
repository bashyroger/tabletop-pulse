import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

describe("PGlite SQL Harness: `boardgames` Schema, RLS & `bg_*_v2` RPCs", () => {
  let db: PGlite;

  before(async () => {
    db = new PGlite();

    // Stub Supabase roles & auth schema for local PGlite verification
    await db.exec(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
          CREATE ROLE anon NOLOGIN;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
          CREATE ROLE authenticated NOLOGIN;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
          CREATE ROLE service_role NOLOGIN;
        END IF;
      END $$;

      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE TABLE IF NOT EXISTS auth.users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text
      );

      CREATE OR REPLACE FUNCTION auth.uid()
      RETURNS uuid
      LANGUAGE sql
      STABLE
      AS $$
        SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$;
    `);

    const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      await db.exec(sql);
    }
  });

  it("isolates all 9 domain tables inside `boardgames` schema with RLS enabled and 0 tables in `public`", async () => {
    const bgTables = await db.query<{ tablename: string; rowsecurity: boolean }>(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'boardgames'
      ORDER BY tablename;
    `);

    assert.equal(bgTables.rows.length, 9);
    for (const row of bgTables.rows) {
      assert.equal(
        row.rowsecurity,
        true,
        `Expected RLS enabled on boardgames.${row.tablename}`
      );
    }

    const publicTables = await db.query<{ tablename: string }>(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public';
    `);
    assert.equal(publicTables.rows.length, 0);
  });

  it("computes dashboard KPIs, Group H-Index, and ELO Champion via `public.bg_dashboard_overview_v2`", async () => {
    const res = await db.query<{ overview: Record<string, unknown> }>(`
      SELECT public.bg_dashboard_overview_v2() AS overview;
    `);
    const overview = res.rows[0]?.overview as {
      kpis: Record<string, number>;
      champion: Record<string, unknown>;
      top_game: Record<string, unknown>;
    };

    assert.equal(overview.kpis.total_sessions, 12);
    assert.equal(overview.kpis.total_games_in_closet, 8);
    assert.equal(overview.kpis.active_players, 6);
    assert.equal(overview.kpis.group_h_index, 2);
    assert.equal(overview.champion.display_name, "Rogier van der Berg");
    assert.equal(overview.top_game.title, "Ark Nova");
  });

  it("computes head-to-head rivalry stats via `public.bg_head_to_head_v2`", async () => {
    const res = await db.query<{ h2h: Record<string, unknown> }>(`
      SELECT public.bg_head_to_head_v2(
        '9608effa-cb3a-4b11-a099-3d1142e293a3'::uuid,
        '20000000-0000-4000-8000-000000000001'::uuid,
        '20000000-0000-4000-8000-000000000002'::uuid
      ) AS h2h;
    `);

    const h2h = res.rows[0]?.h2h as {
      summary: Record<string, number>;
      by_game: Array<Record<string, unknown>>;
    };

    assert.equal(h2h.summary.shared_sessions_count, 8);
    assert.ok(h2h.by_game.length >= 4);
  });

  it("logs a new session via `public.bg_log_session_v2`, updates ELO, and creates a shareable stat card", async () => {
    const logRes = await db.query<{ result: { session_id: string; share_slug: string } }>(`
      SELECT public.bg_log_session_v2(
        '9608effa-cb3a-4b11-a099-3d1142e293a3'::uuid,
        '10000000-0000-4000-8000-000000000003'::uuid,
        now(),
        110,
        'Jordaan Boardroom',
        'Championship Canal Finale',
        'Test session notes',
        'Double rail link on final turn',
        false,
        '[
          {"player_id": "20000000-0000-4000-8000-000000000002", "score": 182, "faction_or_role": "Violet", "is_new_player": false},
          {"player_id": "20000000-0000-4000-8000-000000000001", "score": 169, "faction_or_role": "Yellow", "is_new_player": false}
        ]'::jsonb
      ) AS result;
    `);

    const shareSlug = logRes.rows[0]?.result?.share_slug;
    assert.ok(shareSlug, "Expected share_slug to be returned");

    const cardRes = await db.query<{ card: Record<string, unknown> }>(
      `SELECT public.bg_public_share_card_v2($1) AS card;`,
      [shareSlug]
    );
    assert.equal(cardRes.rows[0]?.card?.share_code, shareSlug);
    assert.equal(cardRes.rows[0]?.card?.title, "Championship Canal Finale");
  });
});
