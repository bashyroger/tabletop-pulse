"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dice5, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmailAction } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);

    startTransition(async () => {
      const res = await signInWithEmailAction(formData);
      if (!res.success) {
        setError(res.error ?? "Authentication failed");
        return;
      }
      toast.success("Signed in to TabletopPulse!");
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-3xl border border-white/[0.08] bg-[#13151C] p-6 shadow-2xl sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#A48DFF] text-[#0B0C10]">
            <Dice5 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#F4F0E8]">
              Sign in to TabletopPulse
            </h1>
            <p className="text-xs text-[#9CA3AF]">
              Manage club members, ELO seasons & private game closets
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {error}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">
              Club Member Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="rogier@tabletoppulse.club"
              className="h-10 border-white/[0.1] bg-[#0E1017] text-xs text-[#F4F0E8]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="h-10 border-white/[0.1] bg-[#0E1017] text-xs text-[#F4F0E8]"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#A48DFF] px-4 py-2.5 text-xs font-semibold text-[#0B0C10] transition hover:bg-[#B8A5FF] disabled:opacity-50"
          >
            <Lock className="h-3.5 w-3.5" />
            {isPending ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-[#5F8F8B]/30 bg-[#0E1017] p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F4F0E8]">
            <Sparkles className="h-3.5 w-3.5 text-[#A48DFF]" />
            Interactive Showcase Club Active
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-[#9CA3AF]">
            You can also explore the live{" "}
            <strong className="text-[#F4F0E8]">Amsterdam Meeple Society</strong>{" "}
            club, log matches, and mint share cards directly without signing in.
          </p>
          <Link
            href="/"
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-xs font-medium text-[#F4F0E8] hover:border-[#A48DFF]/40"
          >
            Continue to Live Club Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
