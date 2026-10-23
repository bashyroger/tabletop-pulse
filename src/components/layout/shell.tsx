"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dice5, Menu, PlusCircle, Share2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { HeaderProvider, useHeaderContext } from "./header-context";
import type { GroupSummary } from "@/lib/supabase/tenant-context";

interface AppShellProps {
  children: React.ReactNode;
  activeGroupId: string;
  activeGroupName: string;
  activeGroupCity: string;
  groups: GroupSummary[];
}

function TopBar({
  activeGroupId,
  activeGroupName,
  activeGroupCity,
  groups,
}: Omit<AppShellProps, "children">) {
  const [open, setOpen] = useState(false);
  const { header } = useHeaderContext();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.08] bg-[#0B0C10]/85 px-4 backdrop-blur-md lg:px-8">
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open navigation menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-[#13151C] text-[#F4F0E8] lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-64 border-r border-white/[0.08] bg-[#0E1017] p-0 text-[#F4F0E8]"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>TabletopPulse Navigation</SheetTitle>
            </SheetHeader>
            <Sidebar
              activeGroupId={activeGroupId}
              activeGroupName={activeGroupName}
              activeGroupCity={activeGroupCity}
              groups={groups}
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-[#F4F0E8]">
            {header.title}
          </span>
          <span className="hidden text-xs text-[#6B7280] sm:inline">•</span>
          <span className="hidden text-xs text-[#9CA3AF] sm:inline">
            {activeGroupName}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/share-studio"
          className="hidden items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#13151C] px-3 py-1.5 text-xs font-medium text-[#F4F0E8] transition hover:border-[#A48DFF]/40 sm:inline-flex"
        >
          <Share2 className="h-3.5 w-3.5 text-[#A48DFF]" />
          Share Studio
        </Link>
        <Link
          href="/sessions?log=1"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#A48DFF] px-3 py-1.5 text-xs font-semibold text-[#0B0C10] shadow-sm transition hover:bg-[#B6A4FF]"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Log Match
        </Link>
      </div>
    </header>
  );
}

export function AppShell({
  children,
  activeGroupId,
  activeGroupName,
  activeGroupCity,
  groups,
}: AppShellProps) {
  const pathname = usePathname();
  const isStandaloneRoute =
    pathname.startsWith("/share/") || pathname === "/login";

  if (isStandaloneRoute) {
    return (
      <div className="min-h-screen bg-[#0B0C10] text-[#F4F0E8]">
        <div className="border-b border-white/[0.08] bg-[#0E1017]/90 px-4 py-3 backdrop-blur-md sm:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#A48DFF] text-[#0B0C10]">
                <Dice5 className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-[#F4F0E8]">
                TabletopPulse
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="rounded-lg border border-white/[0.1] bg-[#13151C] px-3 py-1.5 text-xs font-medium text-[#F4F0E8] hover:border-[#A48DFF]/40"
              >
                Open Club Dashboard →
              </Link>
            </div>
          </div>
        </div>
        <main>{children}</main>
      </div>
    );
  }

  return (
    <HeaderProvider>
      <div className="flex min-h-screen bg-[#0B0C10] text-[#F4F0E8]">
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64">
          <Sidebar
            activeGroupId={activeGroupId}
            activeGroupName={activeGroupName}
            activeGroupCity={activeGroupCity}
            groups={groups}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
          <TopBar
            activeGroupId={activeGroupId}
            activeGroupName={activeGroupName}
            activeGroupCity={activeGroupCity}
            groups={groups}
          />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">{children}</div>
          </main>
          <footer className="border-t border-white/[0.06] px-4 py-4 text-xs text-[#6B7280] sm:px-8">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 sm:flex-row">
              <p>
                TabletopPulse • Isolated{" "}
                <code className="font-mono text-[#A48DFF]">boardgames</code>{" "}
                schema on Supabase
              </p>
              <div className="flex items-center gap-4">
                <Link href="/privacy" className="hover:text-[#F4F0E8]">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-[#F4F0E8]">
                  Terms
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </HeaderProvider>
  );
}
