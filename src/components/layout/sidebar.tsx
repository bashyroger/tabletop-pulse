"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  CalendarClock,
  Crown,
  Dice5,
  LayoutDashboard,
  Settings,
  Share2,
  Sparkles,
  Swords,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceSwitcher } from "./workspace-switcher";
import type { GroupSummary } from "@/lib/supabase/tenant-context";

interface SidebarProps {
  activeGroupId: string;
  activeGroupName: string;
  activeGroupCity: string;
  groups: GroupSummary[];
  onNavigate?: () => void;
}

const NAV_ITEMS = [
  {
    label: "Club Pulse",
    href: "/",
    icon: LayoutDashboard,
    badge: "Live",
  },
  {
    label: "Match Log",
    href: "/sessions",
    icon: CalendarClock,
  },
  {
    label: "Game Closet",
    href: "/games",
    icon: Boxes,
  },
  {
    label: "ELO Leaderboard",
    href: "/players",
    icon: Crown,
  },
  {
    label: "Rivalries H2H",
    href: "/rivalries",
    icon: Swords,
  },
  {
    label: "Share Card Studio",
    href: "/share-studio",
    icon: Share2,
    badge: "Social",
  },
];

export function Sidebar({
  activeGroupId,
  activeGroupName,
  activeGroupCity,
  groups,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-white/[0.08] bg-[#0E1017] text-[#F4F0E8]">
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#A48DFF] text-[#0B0C10] shadow-[0_0_20px_rgba(164,141,255,0.35)]">
            <Dice5 className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-sm font-bold tracking-tight text-[#F4F0E8]">
              TabletopPulse
            </span>
            <span className="block font-mono text-[10px] tracking-widest text-[#A48DFF] uppercase">
              Meeple Telemetry
            </span>
          </div>
        </Link>
      </div>

      {/* Group Switcher */}
      <div className="p-3">
        <WorkspaceSwitcher
          activeGroupId={activeGroupId}
          activeGroupName={activeGroupName}
          activeGroupCity={activeGroupCity}
          groups={groups}
        />
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        <p className="px-2.5 pb-1.5 text-[10px] font-semibold tracking-wider text-[#6B7280] uppercase">
          Tabletop Analytics
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all",
                isActive
                  ? "bg-[#A48DFF]/15 text-[#F4F0E8] shadow-[inset_0_0_0_1px_rgba(164,141,255,0.35)]"
                  : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-[#F4F0E8]"
              )}
            >
              <span className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive
                      ? "text-[#A48DFF]"
                      : "text-[#6B7280] group-hover:text-[#F4F0E8]"
                  )}
                />
                {item.label}
              </span>
              {item.badge ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold",
                    isActive
                      ? "bg-[#A48DFF] text-[#0B0C10]"
                      : "bg-white/[0.06] text-[#9CA3AF]"
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Public Share Showcase Banner */}
      <div className="mx-3 mb-3 rounded-xl border border-[#5F8F8B]/30 bg-gradient-to-br from-[#5F8F8B]/15 via-[#13151C] to-[#A48DFF]/10 p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F4F0E8]">
          <Sparkles className="h-3.5 w-3.5 text-[#A48DFF]" />
          Public Stat Card Link
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-[#9CA3AF]">
          Share live season recaps & ELO badges with your board game group.
        </p>
        <Link
          href="/share/amsterdam-autumn-season-2026"
          onClick={onNavigate}
          className="mt-2.5 inline-flex w-full items-center justify-center rounded-lg bg-white/[0.07] px-2.5 py-1.5 text-[11px] font-semibold text-[#F4F0E8] transition hover:bg-[#A48DFF] hover:text-[#0B0C10]"
        >
          View Autumn Wrapped Card →
        </Link>
      </div>

      {/* Footer / Settings */}
      <div className="border-t border-white/[0.08] p-3">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/settings"
            onClick={onNavigate}
            className="flex flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-[#9CA3AF] transition hover:bg-white/[0.04] hover:text-[#F4F0E8]"
          >
            <Settings className="h-4 w-4 text-[#6B7280]" />
            <span>Club Settings</span>
          </Link>
          <Link
            href="/login"
            onClick={onNavigate}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-[#9CA3AF] transition hover:border-[#A48DFF]/40 hover:text-[#F4F0E8]"
          >
            Account
          </Link>
        </div>
      </div>
    </aside>
  );
}
