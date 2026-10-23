# TabletopPulse

**TabletopPulse** is a multi-tenant board game club analytics, ELO rating, head-to-head rivalry, and social stat-card sharing application built with **Next.js 16 (App Router)**, **Supabase (`boardgames` schema)**, and **Tailwind CSS v4**, deployed on **Hostinger Node.js Web Apps**.

## Features
- **Club Pulse Dashboard (`/`)**: Group H-Index, total table hours, ELO champion spotlight, Recharts play activity & category telemetry, and recent match feed with optimistic cheers.
- **Match Log & Multi-Player Logger (`/sessions`)**: Log board game sessions with dynamic per-player scores, factions/roles, automatic placement calculation, ELO rating deltas, and instant shareable recap cards.
- **Board Game Closet (`/games` & `/games/[slug]`)**: Searchable, sortable `<DataTable />` and visual shelf grid with BGG complexity weights, reigning champions, and high-score records.
- **Meeple ELO Leaderboard (`/players` & `/players/[slug]`)**: Live ELO ratings, win/podium rates, personal H-index, and trophy rooms.
- **Head-to-Head Rivalry Analyzer (`/rivalries`)**: Compare any two players across shared table nights with game-by-game breakdowns.
- **Social Stat Card Studio (`/share-studio` & `/share/[code]`)**: Generate public shareable stat cards in 4 bespoke visual themes (`midnight-gold`, `lavender-noise`, `emerald-tabletop`, `crimson-meeple`).
