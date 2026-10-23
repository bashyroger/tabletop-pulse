import { PageHeader } from "@/components/layout/page-header";

export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        badge="Legal & Data Governance"
        title="Privacy Policy"
        subtitle="How TabletopPulse stores board game match logs, player handles, and public shareable stat cards."
      />
      <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#13151C] p-6 text-sm leading-relaxed text-[#E5E7EB]">
        <p>
          TabletopPulse stores club play sessions, player display names, ELO
          ratings, and shareable stat cards inside the isolated{" "}
          <code className="font-mono text-[#A48DFF]">boardgames</code> PostgreSQL
          schema on Supabase (EU-West-1).
        </p>
        <p>
          Public stat cards created in the Share Studio are accessible via their
          unique <code className="font-mono text-[#A48DFF]">/share/[code]</code>{" "}
          link so you can share recaps on Discord, WhatsApp, or BoardGameGeek.
        </p>
      </div>
    </div>
  );
}
