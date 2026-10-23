import { Database, ShieldCheck, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { getTenantWorkspace } from "@/lib/supabase/tenant-context";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const workspace = await getTenantWorkspace();

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Multi-Tenant Configuration"
        title="Club & Schema Settings"
        subtitle="Inspect active board game group isolation, PostgreSQL schema boundaries, and ELO scoring parameters."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#13151C] p-6">
          <div className="flex items-center gap-2.5 text-sm font-bold text-[#F4F0E8]">
            <Sparkles className="h-4 w-4 text-[#A48DFF]" />
            Active Tabletop Group
          </div>
          <p className="text-xs text-[#9CA3AF]">
            Switch between public and member board game clubs. Your selection
            persists across sessions.
          </p>
          <div className="max-w-xs">
            <WorkspaceSwitcher
              activeGroupId={workspace.activeGroupId}
              activeGroupName={workspace.activeGroupName}
              activeGroupCity={workspace.activeGroupCity}
              groups={workspace.groups}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="rounded-xl border border-white/[0.06] bg-[#0E1017] p-3">
              <p className="text-[10px] text-[#9CA3AF] uppercase">Group Slug</p>
              <p className="mt-1 font-mono font-semibold text-[#F4F0E8]">
                {workspace.activeGroupSlug}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#0E1017] p-3">
              <p className="text-[10px] text-[#9CA3AF] uppercase">Access Role</p>
              <p className="mt-1 font-mono font-semibold text-[#A48DFF] uppercase">
                {workspace.role}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#13151C] p-6">
          <div className="flex items-center gap-2.5 text-sm font-bold text-[#F4F0E8]">
            <Database className="h-4 w-4 text-[#5F8F8B]" />
            PostgreSQL Schema Isolation
          </div>
          <p className="text-xs text-[#9CA3AF]">
            All TabletopPulse tables and ELO rollups reside in dedicated schemas
            inside{" "}
            <code className="font-mono text-[#A48DFF]">macnasmanager</code>:
          </p>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0E1017] px-3.5 py-2.5">
              <span className="text-[#F4F0E8]">boardgames.*</span>
              <span className="text-emerald-300">9 RLS-Protected Tables</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0E1017] px-3.5 py-2.5">
              <span className="text-[#F4F0E8]">boardgames_private.*</span>
              <span className="text-[#A48DFF]">SECURITY DEFINER Helpers</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0E1017] px-3.5 py-2.5">
              <span className="text-[#F4F0E8]">public.bg_*_v2</span>
              <span className="text-amber-300">12 SECURITY INVOKER RPCs</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-300">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Supabase Security & Performance Advisors: 0 Lints in `boardgames`
          </div>
        </div>
      </div>
    </div>
  );
}
