import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hasMinimumRole } from "../src/lib/auth/roles.ts";
import { isPublicPathname } from "../src/lib/public-routes.ts";
import { isStaleServerActionError } from "../src/lib/client/stale-deploy.ts";
import {
  createGameSchema,
  createPlayerSchema,
  createShareCardSchema,
  logSessionSchema,
} from "../src/lib/boardgames/schemas.ts";

describe("Role Hierarchy & Route Guards", () => {
  it("enforces viewer < editor < admin role weights", () => {
    assert.equal(hasMinimumRole("admin", "admin"), true);
    assert.equal(hasMinimumRole("admin", "editor"), true);
    assert.equal(hasMinimumRole("editor", "editor"), true);
    assert.equal(hasMinimumRole("editor", "admin"), false);
    assert.equal(hasMinimumRole("viewer", "editor"), false);
    assert.equal(hasMinimumRole("viewer", "viewer"), true);
  });

  it("identifies public routes and share links", () => {
    assert.equal(isPublicPathname("/"), true);
    assert.equal(isPublicPathname("/share/amsterdam-autumn-season-2026"), true);
    assert.equal(isPublicPathname("/games/ark-nova"), true);
    assert.equal(isPublicPathname("/players/rogier-van-der-berg"), true);
    assert.equal(isPublicPathname("/api/health"), true);
  });

  it("detects stale deployment server action errors", () => {
    assert.equal(
      isStaleServerActionError(
        new Error("Failed to find Server Action 'x91a'. This request might be from an older deployment.")
      ),
      true
    );
    assert.equal(isStaleServerActionError(new Error("Validation failed")), false);
  });
});

describe("Board Games Zod Schemas", () => {
  it("validates createGameSchema and applies sensible defaults", () => {
    const parsed = createGameSchema.safeParse({
      title: "Eclipse: Second Dawn for the Galaxy",
      complexity_weight: 4.33,
      category: "Strategy",
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.scoring_mode, "highest_wins");
      assert.equal(parsed.data.max_players, 4);
    }
  });

  it("rejects invalid createPlayerSchema with empty display_name", () => {
    const parsed = createPlayerSchema.safeParse({
      display_name: "A",
    });
    assert.equal(parsed.success, false);
  });

  it("validates logSessionSchema with multi-player results", () => {
    const parsed = logSessionSchema.safeParse({
      board_game_id: "10000000-0000-4000-8000-000000000001",
      session_title: "Friday Night Ark Nova",
      duration_minutes: 125,
      location: "Jordaan Boardroom",
      results: [
        {
          player_id: "20000000-0000-4000-8000-000000000001",
          score: 28,
          faction_or_role: "Map 4",
          is_new_player: false,
        },
      ],
    });
    assert.equal(parsed.success, true);
  });

  it("validates createShareCardSchema", () => {
    const parsed = createShareCardSchema.safeParse({
      card_type: "group_season",
      title: "Amsterdam Meeple Society • Season Wrapped",
      theme_preset: "midnight-gold",
    });
    assert.equal(parsed.success, true);
  });
});
