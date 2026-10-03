"use client";

import { useActionState } from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { GradientBackdrop } from "@/components/layout/GradientBackdrop";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import {
  ShieldIcon,
  CheckCircleIcon,
  GlobeIcon,
  MailIcon,
  LockIcon,
  SearchIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";
import { login, LoginState } from "@/lib/auth/actions";

const initialState: LoginState = {};

const FEATURES = [
  { icon: ShieldIcon, label: "Tamper-proof certificate records" },
  { icon: CheckCircleIcon, label: "Instant public verification" },
  { icon: GlobeIcon, label: "Anyone can verify, no account needed" },
];

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex min-h-screen flex-col">
      <GradientBackdrop variant="vivid" />
      <PublicHeader
        actionHref="/verify"
        actionLabel="Verify a Certificate"
        actionIcon={<SearchIcon />}
      />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="mb-4 w-full max-w-4xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            ← Return to Home
          </Link>
        </div>
        <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl lg:grid-cols-2">
          <div className="relative">
            <div className="h-1.5 w-full bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-400" />
            <div className="p-8 sm:p-10">
              <h1 className="text-xl font-semibold text-slate-900">Welcome back</h1>
              <p className="mt-1 text-sm text-slate-500">
                Sign in to manage and issue digital certificates
              </p>

              <form action={formAction} className="mt-6 space-y-4">
                {state.error && (
                  <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                    {state.error}
                  </p>
                )}

                <FormField label="Email" htmlFor="email" required>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@organization.edu"
                    icon={<MailIcon />}
                  />
                </FormField>

                <FormField label="Password" htmlFor="password" required>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    icon={<LockIcon />}
                  />
                </FormField>

                <Button type="submit" className="w-full !justify-between" disabled={pending}>
                  <span>{pending ? "Signing in…" : "Login"}</span>
                  {!pending && <ArrowRightIcon />}
                </Button>
              </form>
            </div>
          </div>

          <div className="relative hidden flex-col justify-center overflow-hidden bg-gradient-to-br from-teal-800 via-teal-900 to-emerald-950 p-10 text-white lg:flex">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl"
            />

            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-200">
                Institution Portal
              </p>
              <h2 className="mt-3 text-2xl font-semibold leading-snug">
                Issue certificates your recipients can prove are real.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-teal-100/80">
                Manage your institution&apos;s digital certificates, track their status, and
                revoke them instantly, with every record backed by a blockchain transaction.
              </p>

              <div className="mt-8 space-y-4">
                {FEATURES.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm text-teal-50">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
