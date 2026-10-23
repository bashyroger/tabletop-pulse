"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  CategoryBreakdownPoint,
  MonthlyActivityPoint,
} from "@/lib/boardgames/types";

interface DashboardChartsProps {
  monthlyActivity: MonthlyActivityPoint[];
  categoryBreakdown: CategoryBreakdownPoint[];
}

const CATEGORY_COLORS = [
  "#A48DFF",
  "#5F8F8B",
  "#FF6B6B",
  "#38BDF8",
  "#F59E0B",
  "#10B981",
];

export function DashboardCharts({
  monthlyActivity,
  categoryBreakdown,
}: DashboardChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Monthly Table Hours & Plays */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#13151C] p-5 lg:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#F4F0E8]">
              Monthly Table Hours & Match Cadence
            </h2>
            <p className="text-xs text-[#9CA3AF]">
              Aggregated in PostgreSQL via{" "}
              <code className="font-mono text-[#A48DFF]">
                bg_dashboard_overview_v2
              </code>
            </p>
          </div>
          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] text-[#9CA3AF]">
            Last 6 Months
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyActivity}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="month_label"
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0E1017",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "12px",
                  color: "#F4F0E8",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="hours_played"
                name="Table Hours"
                fill="#A48DFF"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="sessions_count"
                name="Matches Played"
                fill="#5F8F8B"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#13151C] p-5 lg:col-span-5">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-[#F4F0E8]">
            Category Dominance
          </h2>
          <p className="text-xs text-[#9CA3AF]">
            Plays & table hours by board game archetype
          </p>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categoryBreakdown}
              layout="vertical"
              margin={{ top: 0, right: 12, left: 12, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="category"
                width={95}
                tick={{ fill: "#F4F0E8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0E1017",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "12px",
                  color: "#F4F0E8",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="sessions_count" name="Matches" radius={[0, 6, 6, 0]}>
                {categoryBreakdown.map((entry, idx) => (
                  <Cell
                    key={entry.category}
                    fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {categoryBreakdown.slice(0, 4).map((cat, idx) => (
            <div
              key={cat.category}
              className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0E1017] px-3 py-2 text-xs tabular-nums"
            >
              <span className="flex items-center gap-2 truncate text-[#F4F0E8]">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                  }}
                />
                {cat.category}
              </span>
              <span className="font-mono text-[#9CA3AF]">
                {cat.hours_played}h
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
