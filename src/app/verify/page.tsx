"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { GradientBackdrop } from "@/components/layout/GradientBackdrop";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { QrIcon, SearchIcon, HashIcon, ArrowRightIcon } from "@/components/ui/icons";

function extractCertificateId(input: string) {
  const trimmed = input.trim();
  const match = trimmed.match(/\/verify\/([^/?#]+)/);
  return match ? match[1] : trimmed;
}

const STATUS_LEGEND = [
  { status: "valid" as const, description: "Active and not revoked" },
  { status: "expired" as const, description: "Passed its expiration date" },
  { status: "revoked" as const, description: "Cancelled by the issuing institution" },
];

export default function VerifyPage() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const id = extractCertificateId(value);
    if (id) router.push(`/verify/${encodeURIComponent(id)}`);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <GradientBackdrop />
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl lg:grid-cols-2">
          <div className="relative">
            <div className="h-1.5 w-full bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-400" />
            <div className="p-8 sm:p-10">
              <h1 className="text-xl font-semibold text-slate-900">Verify a Certificate</h1>
              <p className="mt-1 text-sm text-slate-500">
                Enter a certificate ID, or paste the verification link from a certificate&apos;s
                QR code, to check its authenticity and status.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <FormField label="Certificate ID or Verification Link" htmlFor="certId" required>
                  <Input
                    id="certId"
                    required
                    placeholder="cert_9f2a1c"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    icon={<HashIcon />}
                  />
                </FormField>
                <Button type="submit" className="w-full !justify-between">
                  <span className="flex items-center gap-2">
                    <SearchIcon className="h-4 w-4" />
                    Verify Certificate
                  </span>
                  <ArrowRightIcon />
                </Button>
              </form>

              <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <QrIcon />
                Received a QR code? Scan it directly with any camera app.
              </p>
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
                What you&apos;ll see
              </p>
              <p className="mt-2 text-sm leading-relaxed text-teal-100/80">
                Every certificate lookup shows its current status, the issuing institution, and
                a blockchain transaction record. No account required.
              </p>

              <div className="mt-8 space-y-4">
                {STATUS_LEGEND.map((item) => (
                  <div key={item.status} className="flex items-center gap-3">
                    <StatusBadge status={item.status} />
                    <span className="text-sm text-teal-50">{item.description}</span>
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
