"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
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
  const [qrError, setQrError] = useState("");
  const [decoding, setDecoding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const id = extractCertificateId(value);
    if (id) router.push(`/verify/${encodeURIComponent(id)}`);
  }

  function handleQrFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setQrError("");
    setDecoding(true);

    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setDecoding(false);
        setQrError("Couldn't read that image. Try a different file.");
        return;
      }
      ctx.drawImage(image, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height);

      setDecoding(false);
      if (!result) {
        setQrError("No QR code found in that image. Try another one, or enter the ID manually.");
        return;
      }

      const id = extractCertificateId(result.data);
      router.push(`/verify/${encodeURIComponent(id)}`);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setDecoding(false);
      setQrError("Couldn't read that image. Try a different file.");
    };
    image.src = objectUrl;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <GradientBackdrop variant="vivid" />
      <PublicHeader />
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
              <h1 className="text-xl font-semibold text-slate-900">Verify a Certificate</h1>
              <p className="mt-1 text-sm text-slate-500">
                Enter the certificate number printed on the certificate, or paste the
                verification link from its QR code, to check its authenticity and status.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <FormField label="Certificate Number or Verification Link" htmlFor="certId" required>
                  <Input
                    id="certId"
                    required
                    placeholder="MTI-2026-00200"
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

              <div className="mt-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-medium text-slate-400">or</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={decoding}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:border-teal-500 hover:text-teal-700 disabled:opacity-50"
              >
                <QrIcon />
                {decoding ? "Reading QR code…" : "Upload a QR code image"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleQrFileChange}
              />

              {qrError && <p className="mt-2 text-xs text-red-600">{qrError}</p>}

              <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                On your phone? You can also scan it directly with your camera app.
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
