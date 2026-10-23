import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/shell";
import { getTenantWorkspace } from "@/lib/supabase/tenant-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "TabletopPulse — Board Game Stats, ELO Rankings & Social Share Cards",
  description:
    "Track board game play sessions, ELO ratings, Group H-Index, head-to-head rivalries, and shareable stat cards for your tabletop group.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const workspace = await getTenantWorkspace();

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0B0C10] text-[#F4F0E8] antialiased">
        <AppShell
          activeGroupId={workspace.activeGroupId}
          activeGroupName={workspace.activeGroupName}
          activeGroupCity={workspace.activeGroupCity}
          groups={workspace.groups}
        >
          {children}
        </AppShell>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#13151C",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#F4F0E8",
            },
          }}
        />
      </body>
    </html>
  );
}
