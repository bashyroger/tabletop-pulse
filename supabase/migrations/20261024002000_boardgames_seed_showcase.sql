-- Migration: 20261024002000_boardgames_seed_showcase.sql
-- Description: Seeds the flagship `Amsterdam Meeple Society` group, 8 board games,
--              6 players with realistic ELO ratings, 12 multi-player play sessions,
--              session cheers, and shareable stat cards in the `boardgames` schema.

-- 1. Seed Flagship Groups
INSERT INTO boardgames.groups (id, slug, name, tagline, city, accent_color, is_public, status)
VALUES
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', 'amsterdam-meeple-society', 'Amsterdam Meeple Society', 'Weekly heavy Euro, engine-building & asymmetric strategy nights along the canals.', 'Amsterdam', '#A48DFF', true, 'active'),
    ('7719bcca-4c21-4e92-b910-8a2251d184b4', 'utrecht-hex-collective', 'Utrecht Hex & Dice Collective', 'Tactical conflict, deckbuilders & Sunday afternoon campaigns.', 'Utrecht', '#5F8F8B', true, 'active')
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Board Games Catalog
INSERT INTO boardgames.games (
    id, group_id, slug, title, subtitle, designer, publisher, release_year,
    min_players, max_players, min_playtime_minutes, max_playtime_minutes,
    complexity_weight, category, scoring_mode, cover_color, bgg_rank, is_favorite
)
VALUES
    ('10000000-0000-4000-8000-000000000001', '9608effa-cb3a-4b11-a099-3d1142e293a3', 'ark-nova', 'Ark Nova', 'Plan and build a modern, scientifically managed zoo.', 'Mathias Wigge', 'Feuerland Spiele', 2021, 1, 4, 90, 150, 3.78, 'Eurogame', 'highest_wins', '#5F8F8B', 3, true),
    ('10000000-0000-4000-8000-000000000002', '9608effa-cb3a-4b11-a099-3d1142e293a3', 'dune-imperium-uprising', 'Dune: Imperium – Uprising', 'Deck-building meets worker placement on Arrakis with sandworms.', 'Paul Dennen', 'Dire Wolf', 2023, 1, 4, 60, 120, 3.51, 'Deckbuilder', 'highest_wins', '#FF6B6B', 6, true),
    ('10000000-0000-4000-8000-000000000003', '9608effa-cb3a-4b11-a099-3d1142e293a3', 'brass-birmingham', 'Brass: Birmingham', 'Build networks, grow industries, and navigate the Industrial Revolution.', 'Gavan Brown, Matt Tolman, Martin Wallace', 'Roxley', 2018, 2, 4, 60, 120, 3.87, 'Strategy', 'highest_wins', '#A48DFF', 1, true),
    ('10000000-0000-4000-8000-000000000004', '9608effa-cb3a-4b11-a099-3d1142e293a3', 'wingspan', 'Wingspan', 'Attract a beautiful and diverse collection of birds to your wildlife preserve.', 'Elizabeth Hargrave', 'Stonemaier Games', 2019, 1, 5, 40, 70, 2.47, 'Engine Builder', 'highest_wins', '#38BDF8', 28, true),
    ('10000000-0000-4000-8000-000000000005', '9608effa-cb3a-4b11-a099-3d1142e293a3', 'terraforming-mars', 'Terraforming Mars', 'Compete as rival corporations to transform Mars into a habitable planet.', 'Jacob Fryxelius', 'FryxGames', 2016, 1, 5, 90, 120, 3.26, 'Engine Builder', 'highest_wins', '#F97316', 7, false),
    ('10000000-0000-4000-8000-000000000006', '9608effa-cb3a-4b11-a099-3d1142e293a3', 'root', 'Root', 'Asymmetric woodland warfare for control of the great forest.', 'Cole Wehrle', 'Leder Games', 2018, 2, 4, 60, 90, 3.81, 'Thematic', 'highest_wins', '#10B981', 31, true),
    ('10000000-0000-4000-8000-000000000007', '9608effa-cb3a-4b11-a099-3d1142e293a3', 'spirit-island', 'Spirit Island', 'Elemental spirits join forces to defend their island home from colonizers.', 'R. Eric Reuss', 'Greater Than Games', 2017, 1, 4, 90, 120, 4.07, 'Cooperative', 'highest_wins', '#8B5CF6', 11, false),
    ('10000000-0000-4000-8000-000000000008', '9608effa-cb3a-4b11-a099-3d1142e293a3', 'cascadia', 'Cascadia', 'Draft habitat tiles and wildlife tokens to build harmonious Pacific Northwest ecosystems.', 'Randy Flynn', 'Flatout Games', 2021, 1, 4, 30, 45, 1.86, 'Abstract', 'highest_wins', '#14B8A6', 54, false)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Players (Meeples)
INSERT INTO boardgames.players (
    id, group_id, slug, display_name, handle, avatar_color, tagline, favorite_category, elo_rating, is_guest
)
VALUES
    ('20000000-0000-4000-8000-000000000001', '9608effa-cb3a-4b11-a099-3d1142e293a3', 'rogier-van-der-berg', 'Rogier van der Berg', '@rogier_meeple', '#A48DFF', 'Canal-network optimizer & shameless sandworm summoner.', 'Strategy', 1348, false),
    ('20000000-0000-4000-8000-000000000002', '9608effa-cb3a-4b11-a099-3d1142e293a3', 'sanne-de-vries', 'Sanne de Vries', '@sanne_wings', '#FF6B6B', 'Conservation track sprinter and undefeated bird engine architect.', 'Eurogame', 1312, false),
    ('20000000-0000-4000-8000-000000000003', '9608effa-cb3a-4b11-a099-3d1142e293a3', 'thijs-vermeer', 'Thijs Vermeer', '@thijs_iron', '#5F8F8B', 'Coal & iron monopolist who never passes up a double rail link.', 'Strategy', 1274, false),
    ('20000000-0000-4000-8000-000000000004', '9608effa-cb3a-4b11-a099-3d1142e293a3', 'lot-bakker', 'Lotte Bakker', '@lotte_woodland', '#F59E0B', 'Eyrie Dynasties commander & chaotic spice trader.', 'Deckbuilder', 1246, false),
    ('20000000-0000-4b11-8000-000000000005', '9608effa-cb3a-4b11-a099-3d1142e293a3', 'daan-hendriks', 'Daan Hendriks', '@daan_mars', '#38BDF8', 'Science tag collector chasing 100+ VP on the red planet.', 'Engine Builder', 1198, false),
    ('20000000-0000-4b11-8000-000000000006', '9608effa-cb3a-4b11-a099-3d1142e293a3', 'mila-koster', 'Mila Koster', '@mila_spirits', '#10B981', 'High-complexity cooperative strategist & wildlife draft specialist.', 'Cooperative', 1222, false)
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Play Sessions
INSERT INTO boardgames.play_sessions (
    id, group_id, board_game_id, share_slug, played_at, duration_minutes, location,
    session_title, session_notes, highlight_moment, is_cooperative_win, is_first_play_for_group, likes_count
)
VALUES
    ('30000000-0000-4000-8000-000000000001', '9608effa-cb3a-4b11-a099-3d1142e293a3', '10000000-0000-4000-8000-000000000003', 'brass-birmingham-canal-showdown-01', '2026-10-21T19:30:00Z', 115, 'Jordaan Boardroom', 'The Great Birmingham Rail Monopoly', 'Four-player heavy Euro clash with brutal beer shortages in the Rail Era.', 'Rogier double-built links into Warrington and flipped two level-4 breweries on the final turn.', NULL, false, 14),
    ('30000000-0000-4000-8000-000000000002', '9608effa-cb3a-4b11-a099-3d1142e293a3', '10000000-0000-4000-8000-000000000001', 'ark-nova-conservation-sprint-02', '2026-10-18T18:00:00Z', 135, 'De Pijp Game Loft', 'Eagle + Panda Conservation Blitz', 'Sanne chained two association workers on turn 6 to cross appeal and conservation first.', 'Sanne triggered the end-game break 2 turns before Thijs could release his Sumatran Tiger.', NULL, false, 19),
    ('30000000-0000-4000-8000-000000000003', '9608effa-cb3a-4b11-a099-3d1142e293a3', '10000000-0000-4000-8000-000000000002', 'dune-uprising-sandworm-finale-03', '2026-10-14T20:00:00Z', 105, 'Jordaan Boardroom', 'Double Sandworm Combat III', 'High-stakes conflict in Round 8 with 4 worms on the battlefield.', 'Lotte played an Intrigue ambush for +6 combat strength to snatch 4 VP in a single battle.', NULL, false, 22),
    ('30000000-0000-4000-8000-000000000004', '9608effa-cb3a-4b11-a099-3d1142e293a3', '10000000-0000-4000-8000-000000000004', 'wingspan-avian-sanctuary-04', '2026-10-10T19:00:00Z', 65, 'Canal Café Table 4', 'Wetlands Tucking Engine Masterclass', 'Fast-paced 4-player game with Oceania nectar boards.', 'Sanne tucked 34 cards under her Greater Flamingo and Mute Swan.', NULL, false, 11),
    ('30000000-0000-4000-8000-000000000005', '9608effa-cb3a-4b11-a099-3d1142e293a3', '10000000-0000-4000-8000-000000000006', 'root-autumn-woodland-war-05', '2026-10-04T19:30:00Z', 95, 'De Pijp Game Loft', 'Woodland Alliance Uprising', 'Classic 4-faction battle across the Autumn clearing map.', 'Rogier spread sympathy tokens to 3 fox clearings at once for a 9-point final turn burst.', NULL, false, 16),
    ('30000000-0000-4000-8000-000000000006', '9608effa-cb3a-4b11-a099-3d1142e293a3', '10000000-0000-4000-8000-000000000005', 'terraforming-mars-tharsis-06', '2026-09-27T18:30:00Z', 125, 'Jordaan Boardroom', 'Greenery & Jovian Multiplier Race', 'Prelude + Hellas map with fierce milestone competition.', 'Daan dropped 3 Jovian multipliers in the final generation to overtake Thijs by 4 VP.', NULL, false, 9),
    ('30000000-0000-4000-8000-000000000007', '9608effa-cb3a-4b11-a099-3d1142e293a3', '10000000-0000-4000-8000-000000000007', 'spirit-island-prussia-level4-07', '2026-09-20T14:00:00Z', 110, 'De Pijp Game Loft', 'Brandenburg-Prussia Level 4 Defense', 'Three-spirit cooperative defense at Terror Level III.', 'Mila cleared two coastal cities with Ocean''s Hungry Grasp right before the Stage III Escalation.', true, false, 15),
    ('30000000-0000-4000-8000-000000000008', '9608effa-cb3a-4b11-a099-3d1142e293a3', '10000000-0000-4000-8000-000000000001', 'ark-nova-silver-lake-duel-08', '2026-09-12T19:30:00Z', 110, 'Jordaan Boardroom', 'Silver Lake Reptile House Duel', 'Tight 3-player Ark Nova session decided by End-of-Game scoring cards.', 'Rogier completed both Conservation Hero and Large Bird Aviary for +14 final points.', NULL, false, 12),
    ('30000000-0000-4000-8000-000000000009', '9608effa-cb3a-4b11-a099-3d1142e293a3', '10000000-0000-4000-8000-000000000002', 'dune-uprising-fremen-alliance-09', '2026-08-29T20:00:00Z', 100, 'Jordaan Boardroom', 'Spice Must Flow: Muad''Dib Victory', 'Four-player battle where Emperor and Fremen alliances flipped twice.', 'Thijs secured the Swordmaster in Round 3 and locked down High Council.', NULL, false, 13),
    ('30000000-0000-4000-8000-000000000010', '9608effa-cb3a-4b11-a099-3d1142e293a3', '10000000-0000-4000-8000-000000000003', 'brass-birmingham-pottery-gambit-10', '2026-08-15T19:30:00Z', 120, 'De Pijp Game Loft', 'The Stoke-on-Trent Pottery Gambit', 'Sanne vs. Rogier vs. Thijs in an all-out cotton & pottery war.', 'Thijs sold three cotton mills in a single Merchant action to take a 12-point lead.', NULL, false, 10),
    ('30000000-0000-4000-8000-000000000011', '9608effa-cb3a-4b11-a099-3d1142e293a3', '10000000-0000-4000-8000-000000000008', 'cascadia-salmon-run-11', '2026-08-03T16:00:00Z', 42, 'Canal Café Table 4', 'Sunday Cascadia Wildlife Draft', 'Relaxed Sunday afternoon tile-layer with A-scoring cards.', 'Mila connected an 11-tile river corridor and scored 28 points on Elk herds.', NULL, false, 8),
    ('30000000-0000-4000-8000-000000000012', '9608effa-cb3a-4b11-a099-3d1142e293a3', '10000000-0000-4000-8000-000000000001', 'ark-nova-marine-worlds-12', '2026-07-22T19:00:00Z', 130, 'Jordaan Boardroom', 'Marine Worlds Reef Expansion Night', 'First full group play with Marine Worlds reefs and asymmetric action cards.', 'Sanne drafted the Shark Reef Dweller combo for a +31 differential.', NULL, true, 17)
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Play Session Results
INSERT INTO boardgames.play_session_results (
    group_id, session_id, player_id, faction_or_role, score, placement, is_winner, is_new_player, elo_delta, score_breakdown
)
VALUES
    -- Session 1: Brass Birmingham
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Yellow • Brewers & Rails', 168, 1, true, false, 24, '{"links_vp": 72, "industries_vp": 84, "money_vp": 12}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 'Crimson • Coal & Iron', 159, 2, false, false, 8, '{"links_vp": 64, "industries_vp": 88, "money_vp": 7}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'Violet • Pottery & Cotton', 151, 3, false, false, -6, '{"links_vp": 52, "industries_vp": 91, "money_vp": 8}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000004', 'Teal • Manufactured Goods', 138, 4, false, false, -14, '{"links_vp": 46, "industries_vp": 84, "money_vp": 8}'::jsonb),

    -- Session 2: Ark Nova
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'Map 4 • Commercial Harbor', 29, 1, true, false, 24, '{"appeal": 78, "conservation_points": 29, "final_scoring_vp": 11}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Map 8 • Hollywood Hills', 21, 2, false, false, 6, '{"appeal": 74, "conservation_points": 26, "final_scoring_vp": 9}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000003', 'Map 2 • Outdoor Areas', 14, 3, false, false, -10, '{"appeal": 69, "conservation_points": 24, "final_scoring_vp": 8}'::jsonb),

    -- Session 3: Dune Imperium Uprising
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000004', 'Muad''Dib (Paul Atreides)', 12, 1, true, false, 26, '{"faction_alliances": 2, "combat_vp": 6, "intrigue_vp": 2, "spice_left": 7}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'Feyd-Rautha Harkonnen', 10, 2, false, false, 8, '{"faction_alliances": 1, "combat_vp": 5, "intrigue_vp": 2, "spice_left": 5}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000003', '20000000-0000-4b11-8000-000000000005', 'Princess Irulan', 9, 3, false, false, -6, '{"faction_alliances": 2, "combat_vp": 2, "intrigue_vp": 3, "spice_left": 4}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', 'Lady Margot Fenring', 8, 4, false, false, -14, '{"faction_alliances": 1, "combat_vp": 3, "intrigue_vp": 1, "spice_left": 2}'::jsonb),

    -- Session 4: Wingspan
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000002', 'Wetlands Tucking Engine', 114, 1, true, false, 22, '{"birds_vp": 42, "tucked_cards": 34, "eggs": 16, "bonus_cards": 14, "nectar": 8}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000004', '20000000-0000-4b11-8000-000000000006', 'Forest Nectar Predator', 103, 2, false, false, 8, '{"birds_vp": 48, "tucked_cards": 12, "eggs": 19, "bonus_cards": 15, "nectar": 9}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', 'Grassland Egg Layer', 96, 3, false, false, -4, '{"birds_vp": 39, "tucked_cards": 10, "eggs": 28, "bonus_cards": 12, "nectar": 7}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000004', '20000000-0000-4b11-8000-000000000005', 'Hybrid Migratory Flock', 89, 4, false, false, -12, '{"birds_vp": 41, "tucked_cards": 8, "eggs": 18, "bonus_cards": 16, "nectar": 6}'::jsonb),

    -- Session 5: Root
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000001', 'Woodland Alliance', 30, 1, true, false, 24, '{"sympathy_vp": 19, "crafted_items_vp": 6, "battle_vp": 5}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000004', 'Eyrie Dynasties', 28, 2, false, false, 6, '{"roosts_vp": 21, "crafted_items_vp": 3, "battle_vp": 4}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000003', 'Marquise de Cat', 25, 3, false, false, -6, '{"buildings_vp": 18, "crafted_items_vp": 4, "battle_vp": 3}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000005', '20000000-0000-4b11-8000-000000000006', 'Vagabond (Thief)', 24, 4, false, false, -12, '{"quests_vp": 14, "aid_vp": 6, "infamy_vp": 4}'::jsonb),

    -- Session 6: Terraforming Mars
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000006', '20000000-0000-4b11-8000-000000000005', 'Saturn Systems', 98, 1, true, false, 24, '{"tr": 38, "awards_milestones": 15, "greeneries_cities": 16, "cards_vp": 29}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000003', 'Tharsis Republic', 94, 2, false, false, 6, '{"tr": 41, "awards_milestones": 10, "greeneries_cities": 29, "cards_vp": 14}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000001', 'Point Luna', 89, 3, false, false, -10, '{"tr": 36, "awards_milestones": 10, "greeneries_cities": 18, "cards_vp": 25}'::jsonb),

    -- Session 7: Spirit Island (Cooperative Victory)
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000007', '20000000-0000-4b11-8000-000000000006', 'Ocean''s Hungry Grasp', 68, 1, true, false, 16, '{"difficulty": 7, "invader_cards_left": 3, "dahan_surviving": 18, "blight_on_island": 4}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000002', 'Thunderspeaker', 68, 1, true, false, 16, '{"difficulty": 7, "invader_cards_left": 3, "dahan_surviving": 18, "blight_on_island": 4}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000001', 'Spread of Rampant Green', 68, 1, true, false, 16, '{"difficulty": 7, "invader_cards_left": 3, "dahan_surviving": 18, "blight_on_island": 4}'::jsonb),

    -- Session 8: Ark Nova
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000001', 'Map 1 • Observation Tower', 26, 1, true, false, 20, '{"appeal": 76, "conservation_points": 28}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000002', 'Map 6 • Research Institute', 23, 2, false, false, 6, '{"appeal": 73, "conservation_points": 27}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000004', 'Map 5 • Park Restaurant', 11, 3, false, false, -10, '{"appeal": 64, "conservation_points": 23}'::jsonb),

    -- Session 9: Dune Imperium Uprising
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000003', 'Gurney Halleck', 11, 1, true, false, 22, '{"faction_alliances": 2, "combat_vp": 5}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000001', 'Muad''Dib', 10, 2, false, false, 6, '{"faction_alliances": 1, "combat_vp": 6}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000004', 'Staban Tuek', 9, 3, false, false, -6, '{"faction_alliances": 1, "combat_vp": 3}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000002', 'Amber Metulli', 8, 4, false, false, -12, '{"faction_alliances": 1, "combat_vp": 2}'::jsonb),

    -- Session 10: Brass Birmingham
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000003', 'Crimson • Cotton & Rails', 174, 1, true, false, 22, '{"links_vp": 76, "industries_vp": 90, "money_vp": 8}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000001', 'Yellow • Iron & Beer', 162, 2, false, false, 6, '{"links_vp": 68, "industries_vp": 84, "money_vp": 10}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000002', 'Violet • Pottery', 155, 3, false, false, -10, '{"links_vp": 58, "industries_vp": 89, "money_vp": 8}'::jsonb),

    -- Session 11: Cascadia
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000011', '20000000-0000-4b11-8000-000000000006', 'River & Elk Corridor', 102, 1, true, false, 20, '{"wildlife_vp": 62, "habitats_vp": 34, "nature_tokens": 6}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000002', 'Salmon & Hawk Run', 97, 2, false, false, 6, '{"wildlife_vp": 58, "habitats_vp": 35, "nature_tokens": 4}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000011', '20000000-0000-4b11-8000-000000000005', 'Bear Mountain', 91, 3, false, false, -10, '{"wildlife_vp": 54, "habitats_vp": 34, "nature_tokens": 3}'::jsonb),

    -- Session 12: Ark Nova Marine Worlds
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000002', 'Marine Reef Sanctuary', 31, 1, true, false, 24, '{"appeal": 82, "conservation_points": 30}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000001', 'Geographic Zoo', 22, 2, false, false, 6, '{"appeal": 75, "conservation_points": 27}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000004', 'Rescue Station', 15, 3, false, false, -6, '{"appeal": 68, "conservation_points": 25}'::jsonb),
    ('9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000012', '20000000-0000-4b11-8000-000000000006', 'Aquarium Specialist', 9, 4, false, false, -14, '{"appeal": 62, "conservation_points": 23}'::jsonb)
ON CONFLICT (session_id, player_id) DO NOTHING;

-- 6. Seed Session Cheers
INSERT INTO boardgames.session_cheers (
    id, group_id, session_id, reactor_name, reaction_type, comment_text
)
VALUES
    ('40000000-0000-4000-8000-000000000001', '9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000001', 'Sanne de Vries', 'fire', 'That double brewery flip in Warrington stole the entire Rail Era!'),
    ('40000000-0000-4000-8000-000000000002', '9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000002', 'Rogier van der Berg', 'trophy', 'Turn 6 double conservation project was unstoppable.'),
    ('40000000-0000-4000-8000-000000000003', '9608effa-cb3a-4b11-a099-3d1142e293a3', '30000000-0000-4000-8000-000000000003', 'Thijs Vermeer', 'mindblown', 'Four sandworms in Combat III and Lotte still pulled +6 ambush!')
ON CONFLICT (id) DO NOTHING;

-- 7. Seed Shareable Stat Cards
INSERT INTO boardgames.shared_stat_cards (
    id, group_id, share_code, card_type, title, subtitle, theme_preset,
    session_id, player_id, board_game_id, snapshot_payload, cheers_count, views_count, is_public
)
VALUES
    (
        '50000000-0000-4000-8000-000000000001',
        '9608effa-cb3a-4b11-a099-3d1142e293a3',
        'amsterdam-autumn-season-2026',
        'group_season',
        'Amsterdam Meeple Society • Autumn 2026 Wrapped',
        '12 Table Nights • 21.2 Hours Played • Group H-Index 3',
        'midnight-gold',
        NULL,
        NULL,
        NULL,
        '{"total_sessions": 12, "total_hours": 21.2, "group_h_index": 3, "top_player": "Rogier van der Berg (1348 ELO)", "most_played_game": "Ark Nova (3 plays)", "signature_moment": "168 VP Brass: Birmingham Rail Monopoly"}'::jsonb,
        28,
        142,
        true
    ),
    (
        '50000000-0000-4000-8000-000000000002',
        '9608effa-cb3a-4b11-a099-3d1142e293a3',
        'rogier-elo-champion-card',
        'player_spotlight',
        'Rogier van der Berg • #1 Group ELO Leader',
        '1348 ELO • 40.0% Win Rate • 100% Podium Finish Rate',
        'lavender-noise',
        NULL,
        '20000000-0000-4000-8000-000000000001',
        NULL,
        '{"player_name": "Rogier van der Berg", "handle": "@rogier_meeple", "elo_rating": 1348, "games_played": 10, "wins_count": 4, "podium_rate": 100, "signature_game": "Brass: Birmingham", "best_score": "168 VP"}'::jsonb,
        19,
        87,
        true
    ),
    (
        '50000000-0000-4000-8000-000000000003',
        '9608effa-cb3a-4b11-a099-3d1142e293a3',
        'sanne-vs-rogier-euro-rivalry',
        'rivalry_head_to_head',
        'Rogier vs. Sanne • The Heavy Euro Rivalry',
        '8 Shared Matches • 3 Wins Each • 1.88 vs 1.75 Avg Placement',
        'crimson-meeple',
        NULL,
        '20000000-0000-4000-8000-000000000002',
        NULL,
        '{"player_a": "Rogier van der Berg (1348 ELO)", "player_b": "Sanne de Vries (1312 ELO)", "shared_matches": 8, "scoreline": "4 - 4 Head-to-Head Finishes", "key_battleground": "Ark Nova & Brass: Birmingham"}'::jsonb,
        24,
        115,
        true
    ),
    (
        '50000000-0000-4000-8000-000000000004',
        '9608effa-cb3a-4b11-a099-3d1142e293a3',
        'ark-nova-table-mastery',
        'game_mastery',
        'Ark Nova • Club Mastery Dossier',
        '3 Plays • 6.3 Table Hours • High Score: +31 (Sanne de Vries)',
        'emerald-tabletop',
        NULL,
        NULL,
        '10000000-0000-4000-8000-000000000001',
        '{"game_title": "Ark Nova", "complexity": "3.78 / 5.00", "plays_count": 3, "reigning_champion": "Sanne de Vries (2 Wins)", "high_score": "31 Differential VP"}'::jsonb,
        16,
        64,
        true
    )
ON CONFLICT (id) DO NOTHING;
