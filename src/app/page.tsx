import Link from "next/link";
import {
  Award,
  Boxes,
  Clock,
  Crown,
  Flame,
  Hash,
  Share2,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardCharts } from "@/components/boardgames/dashboard-charts";
import { LogSessionDialog } from "@/components/boardgames/log-session-dialog";
import { SessionCard } from "@/components/boardgames/session-card";
import { ShareCardRenderer } from "@/components/boardgames/share-card-renderer";
import {
  getDashboardOverview,
  getGamesCatalog,
  getPlayersLeaderboard,
  getSessionsFeed,
  getSharedStatCards,
} from "@/lib/boardgames/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [overview, games, players, recentSessions, sharedCards] =
    await Promise.all([
      getDashboardOverview(),
      getGamesCatalog(),
      getPlayersLeaderboard(),
      getSessionsFeed({ limit: 5 }),
      getSharedStatCards(),
    ]);

  const { group, kpis, champion, top_game } = overview;
  const featuredCard = sharedCards[0] ?? null;

  return (
    <div className="space-y-8">
      <PageHeader
        badge={`${group.city} Tabletop Club • boardgames schema`}
        title={group.name}
        subtitle={group.tagline}
        actions={
          <>
            <Link
              href="/share-studio"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-[#13151C] px-3.5 py-2 text-xs font-medium text-[#F4F0E8] transition hover:border-[#A48DFF]/40"
            >
              <Share2 className="h-4 w-4 text-[#A48DFF]" />
              Share Season Wrapped
            </Link>
            <LogSessionDialog games={games} players={players} />
          </>
        }
      />

      {/* Primary KPI Grid */}
      <section className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-white/[0.08] bg-[#13151C] p-4">
          <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
            <span>Matches Logged</span>
            <Trophy className="h-4 w-4 text-[#A48DFF]" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#F4F0E8] tabular-nums">
            {kpis.total_sessions}
          </p>
          <p className="mt-1 text-[11px] text-[#9CA3AF] tabular-nums">
            Avg {kpis.avg_session_minutes} min / table
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#13151C] p-4">
          <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
            <span>Table Hours</span>
            <Clock className="h-4 w-4 text-[#5F8F8B]" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#F4F0E8] tabular-nums">
            {kpis.total_hours}h
          </p>
          <p className="mt-1 text-[11px] text-[#9CA3AF] tabular-nums">
            Weight avg {kpis.avg_complexity_weight}/5.0
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#13151C] p-4">
          <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
            <span>Club H-Index</span>
            <Hash className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-amber-300 tabular-nums">
            {kpis.group_h_index}
          </p>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">
            {kpis.group_h_index} games played ≥{kpis.group_h_index}×
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#13151C] p-4">
          <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
            <span>Game Closet</span>
            <Boxes className="h-4 w-4 text-[#38BDF8]" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#F4F0E8] tabular-nums">
            {kpis.unique_games_played}/{kpis.total_games_in_closet}
          </p>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">
            Titles hitting the table
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#13151C] p-4">
          <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
            <span>Active Meeples</span>
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#F4F0E8] tabular-nums">
            {kpis.active_players}
          </p>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">
            Ranked ELO competitors
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#13151C] p-4">
          <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
            <span>Table Cheers</span>
            <Flame className="h-4 w-4 text-[#FF6B6B]" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#FF6B6B] tabular-nums">
            {kpis.total_cheers}
          </p>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">
            Social reactions & kudos
          </p>
        </div>
      </section>

      {/* Spotlight Row: Reigning ELO Champion + Most Played Game + Rivalry Shortcut */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* ELO Champion */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/10 via-[#13151C] to-[#13151C] p-5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-amber-300 uppercase">
              <Crown className="h-3 w-3" />
              #1 Club ELO Leader
            </span>
            <Link
              href={`/players/${champion.slug}`}
              className="text-xs font-medium text-amber-300 hover:underline"
            >
              Trophy Room →
            </Link>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#F4F0E8]">
                {champion.display_name}
              </h2>
              <p className="font-mono text-xs text-[#9CA3AF]">
                {champion.handle}
              </p>
            </div>
            <div className="text-right tabular-nums">
              <p className="font-mono text-2xl font-bold text-amber-300">
                {champion.elo_rating}
              </p>
              <p className="text-[11px] text-[#9CA3AF]">
                {champion.win_rate}% Win Rate ({champion.wins_count}/
                {champion.games_played})
              </p>
            </div>
          </div>
        </div>

        {/* Most Played Game */}
        <div className="relative overflow-hidden rounded-2xl border border-[#A48DFF]/25 bg-gradient-to-br from-[#A48DFF]/12 via-[#13151C] to-[#13151C] p-5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A48DFF]/30 bg-[#A48DFF]/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-[#A48DFF] uppercase">
              <Award className="h-3 w-3" />
              Most Played Title
            </span>
            <Link
              href={`/games/${top_game.slug}`}
              className="text-xs font-medium text-[#A48DFF] hover:underline"
            >
              Game Dossier →
            </Link>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#F4F0E8]">
                {top_game.title}
              </h2>
              <p className="text-xs text-[#9CA3AF]">
                {top_game.category} • Weight{" "}
                <span className="font-mono tabular-nums">
                  {top_game.complexity_weight}
                </span>
              </p>
            </div>
            <div className="text-right tabular-nums">
              <p className="font-mono text-2xl font-bold text-[#A48DFF]">
                {top_game.plays_count}×
              </p>
              <p className="text-[11px] text-[#9CA3AF]">
                {top_game.total_hours}h on table
              </p>
            </div>
          </div>
        </div>

        {/* Rivalry Callout */}
        <div className="relative overflow-hidden rounded-2xl border border-[#FF6B6B]/25 bg-gradient-to-br from-[#FF6B6B]/12 via-[#13151C] to-[#13151C] p-5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FF6B6B]/30 bg-[#FF6B6B]/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-[#FF6B6B] uppercase">
              <Swords className="h-3 w-3" />
              Head-to-Head Rivalries
            </span>
            <Link
              href="/rivalries"
              className="text-xs font-medium text-[#FF6B6B] hover:underline"
            >
              Analyze Rivalry →
            </Link>
          </div>
          <div className="mt-4">
            <h2 className="text-lg font-bold text-[#F4F0E8]">
              {players[0]?.display_name ?? "Rogier"} vs.{" "}
              {players[1]?.display_name ?? "Sanne"}
            </h2>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Compare shared matches, outplacement ratios, and per-game average
              VP differentials.
            </p>
          </div>
        </div>
      </section>

      {/* Recharts Visualizations */}
      <DashboardCharts
        monthlyActivity={overview.monthly_activity}
        categoryBreakdown={overview.category_breakdown}
      />

      {/* Split Section: Recent Matches + Featured Social Stat Card */}
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#F4F0E8]">
                Recent Table Nights
              </h2>
              <p className="text-xs text-[#9CA3AF]">
                Live match feed with per-player ELO deltas & optimistic cheers
              </p>
            </div>
            <Link
              href="/sessions"
              className="text-xs font-semibold text-[#A48DFF] hover:underline"
            >
              View All {kpis.total_sessions} Matches →
            </Link>
          </div>

          <div className="space-y-3.5">
            {recentSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>

        {/* Right Column: Featured Share Card + Top 5 ELO Standings */}
        <div className="space-y-6 lg:col-span-5">
          {featuredCard ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#F4F0E8]">
                    Featured Social Share Card
                  </h2>
                  <p className="text-xs text-[#9CA3AF]">
                    Ready to share on Discord, WhatsApp, or BGG forums
                  </p>
                </div>
                <Link
                  href="/share-studio"
                  className="text-xs font-semibold text-[#A48DFF] hover:underline"
                >
                  Open Studio →
                </Link>
              </div>
              <ShareCardRenderer card={featuredCard} compact />
            </div>
          ) : null}

          {/* Quick ELO Standings */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#13151C] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F4F0E8]">
                Club ELO Standings
              </h3>
              <Link
                href="/players"
                className="text-xs font-medium text-[#A48DFF] hover:underline"
              >
                Full Leaderboard →
              </Link>
            </div>
            <div className="space-y-2">
              {players.slice(0, 6).map((p, idx) => (
                <Link
                  key={p.id}
                  href={`/players/${p.slug}`}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0E1017] px-3.5 py-2.5 transition hover:border-[#A48DFF]/40"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#9CA3AF] tabular-nums">
                      #{idx + 1}
                    </span>
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: p.avatar_color }}
                    />
                    <div>
                      <p className="text-xs font-semibold text-[#F4F0E8]">
                        {p.display_name}
                      </p>
                      <p className="text-[11px] text-[#9CA3AF]">
                        {p.signature_game_title} • H-Index {p.player_h_index}
                      </p>
                    </div>
                  </div>
                  <div className="text-right tabular-nums">
                    <p className="font-mono text-xs font-bold text-[#A48DFF]">
                      {p.elo_rating} ELO
                    </p>
                    <p className="font-mono text-[10px] text-[#9CA3AF]">
                      {p.win_rate}% Win ({p.wins_count}W)
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
