import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Dice5, Sparkles } from "lucide-react";
import { ShareCardRenderer } from "@/components/boardgames/share-card-renderer";
import { getPublicShareCardByCode } from "@/lib/boardgames/queries";

export const dynamic = "force-dynamic";

export default async function PublicShareCardPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const card = await getPublicShareCardByCode(code);

  if (!card) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/share-studio"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9CA3AF] hover:text-[#F4F0E8]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Share Studio
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A48DFF]/30 bg-[#A48DFF]/10 px-3 py-1 font-mono text-[11px] font-semibold text-[#A48DFF]">
          <Sparkles className="h-3.5 w-3.5" />
          Verified TabletopPulse Snapshot
        </span>
      </div>

      <ShareCardRenderer card={card} />

      <div className="mt-8 rounded-2xl border border-white/[0.08] bg-[#13151C] p-5 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#A48DFF]/15 text-[#A48DFF]">
          <Dice5 className="h-5 w-5" />
        </div>
        <h2 className="mt-3 text-sm font-bold text-[#F4F0E8]">
          Track Your Own Board Game Club on TabletopPulse
        </h2>
        <p className="mx-auto mt-1 max-w-md text-xs text-[#9CA3AF]">
          Live ELO ratings, BGG complexity weights, Group H-Index, and instant
          shareable match cards powered by PostgreSQL.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-[#A48DFF] px-4 py-2 text-xs font-semibold text-[#0B0C10] hover:bg-[#B8A5FF]"
          >
            Explore Club Dashboard
          </Link>
          <Link
            href="/sessions"
            className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-medium text-[#F4F0E8] hover:border-[#A48DFF]/40"
          >
            View Match Log
          </Link>
        </div>
      </div>
    </div>
  );
}
