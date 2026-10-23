import { PageHeader } from "@/components/layout/page-header";

export default function TermsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        badge="Club Guidelines"
        title="Terms of Service"
        subtitle="Fair play, accurate score logging, and community standards for TabletopPulse."
      />
      <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#13151C] p-6 text-sm leading-relaxed text-[#E5E7EB]">
        <p>
          By logging matches on TabletopPulse, club members agree to record
          accurate tabletop scores, honour cooperative victories and losses, and
          keep shared stat card commentary welcoming for all players.
        </p>
      </div>
    </div>
  );
}
