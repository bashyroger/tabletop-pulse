"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Dice5, MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { switchActiveGroupAction } from "@/app/actions/workspace";
import { recoverFromStaleDeployment } from "@/lib/client/stale-deploy";
import type { GroupSummary } from "@/lib/supabase/tenant-context";
import { toast } from "sonner";

interface WorkspaceSwitcherProps {
  activeGroupId: string;
  activeGroupName: string;
  activeGroupCity: string;
  groups: GroupSummary[];
}

export function WorkspaceSwitcher({
  activeGroupId,
  activeGroupName,
  activeGroupCity,
  groups,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSelectGroup(group: GroupSummary) {
    if (group.group_id === activeGroupId) return;
    startTransition(async () => {
      try {
        await switchActiveGroupAction(group.group_id);
        toast.success(`Switched table group to ${group.name}`);
        router.refresh();
      } catch (err) {
        if (!recoverFromStaleDeployment(err)) {
          toast.error("Could not switch board game group");
        }
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isPending}
          data-testid="workspace-switcher"
          className="flex w-full items-center justify-between gap-2.5 rounded-xl border border-white/[0.08] bg-[#171A24] px-3 py-2.5 text-left transition hover:border-[#A48DFF]/40 hover:bg-[#1C202C]"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#A48DFF] to-[#5F8F8B] text-[#0B0C10] shadow-sm">
              <Dice5 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[#F4F0E8]">
                {activeGroupName}
              </p>
              <p className="flex items-center gap-1 truncate text-[11px] text-[#9CA3AF]">
                <MapPin className="h-3 w-3 text-[#A48DFF]" />
                {activeGroupCity} Club
              </p>
            </div>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64 border-white/[0.1] bg-[#13151C] text-[#F4F0E8]"
      >
        <DropdownMenuLabel className="text-[11px] tracking-wider text-[#9CA3AF] uppercase">
          Board Game Clubs (`boardgames` schema)
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/[0.08]" />
        {groups.map((group) => {
          const isSelected = group.group_id === activeGroupId;
          return (
            <DropdownMenuItem
              key={group.group_id}
              onClick={() => handleSelectGroup(group)}
              className="flex cursor-pointer items-center justify-between gap-2 py-2 focus:bg-white/[0.06] focus:text-[#F4F0E8]"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-[#F4F0E8]">
                  {group.name}
                </p>
                <p className="text-[11px] text-[#9CA3AF]">
                  {group.city} • {group.role}
                </p>
              </div>
              {isSelected ? (
                <Check className="h-4 w-4 shrink-0 text-[#A48DFF]" />
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
