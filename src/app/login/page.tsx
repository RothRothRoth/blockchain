"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { Logo } from "@/components/ui/Logo";
import {
  ShieldIcon,
  CheckCircleIcon,
  GlobeIcon,
  MailIcon,
  LockIcon,
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-100 via-teal-50 to-white px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(#0f4c4633_1.5px,transparent_1.5px)] [background-size:28px_28px] [mask-image:radial-gradient(circle_at_center,black,transparent_75%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-teal-300/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -bottom-32 h-[28rem] w-[28rem] rounded-full bg-emerald-300/50 blur-3xl"
      />

      <div className="relative grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl lg:grid-cols-2">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-teal-800 via-teal-900 to-emerald-950 p-10 text-white lg:flex">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl"
          />

          <div className="relative">
            <span className="text-lg font-semibold tracking-tight">Certi</span>
            <span className="ml-3 inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-teal-100">
              Institution Portal
            </span>
            <h2 className="mt-10 text-2xl font-semibold leading-snug">
              Issue certificates your recipients can prove are real.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-teal-100/80">
              Manage your institution&apos;s digital certificates, track their status, and
              revoke them instantly, with every record backed by a blockchain transaction.
            </p>
          </div>

          <div className="relative space-y-4">
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

        <div className="relative">
          <div className="h-1.5 w-full bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-400" />
          <div className="p-8 sm:p-10">
            <Link href="/" className="mb-8 flex flex-col items-center lg:items-start">
              <Logo size={40} />
              <h1 className="mt-3 text-lg font-semibold text-slate-900">Welcome back</h1>
              <p className="mt-1 text-sm text-slate-500">
                Sign in to manage and issue digital certificates
              </p>
            </Link>

            <form action={formAction} className="space-y-4">
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

              <p className="text-center text-xs text-slate-400">
                Demo credentials: lena.fischer@metrotechnical.edu / password123
              </p>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              <Link href="/verify" className="font-medium hover:text-teal-700">
                Verify a certificate instead →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
