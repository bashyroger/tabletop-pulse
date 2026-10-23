"use client";

import { useEffect } from "react";
import { useHeaderContext } from "./header-context";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
}: PageHeaderProps) {
  const { setHeader } = useHeaderContext();

  useEffect(() => {
    setHeader({ title, subtitle, badge });
  }, [title, subtitle, badge, setHeader]);

  return (
    <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1.5">
        {badge ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-[#A48DFF]/30 bg-[#A48DFF]/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-[#A48DFF] uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[#A48DFF]" />
            {badge}
          </div>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-[#F4F0E8] sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-2xl text-sm text-[#9CA3AF]">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
      ) : null}
    </div>
  );
}
