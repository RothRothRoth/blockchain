"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
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

export default function OrgVerificationPage() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const id = extractCertificateId(value);
    if (id) router.push(`/verification/${encodeURIComponent(id)}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-slate-950">Certificate Verification</h1>
      <p className="mt-1 text-sm font-medium text-slate-700">
        Look up any certificate by ID, the same way a public verifier would, without leaving
        your dashboard.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Verify a Certificate</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
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

          <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <QrIcon />
            Received a QR code? Scan it directly with any camera app.
          </p>
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>What you&apos;ll see</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-slate-500">
            Every certificate lookup shows its current status, the issuing institution, and a
            blockchain transaction record.
          </p>
          <div className="mt-4 space-y-3">
            {STATUS_LEGEND.map((item) => (
              <div key={item.status} className="flex items-center gap-3">
                <StatusBadge status={item.status} />
                <span className="text-sm text-slate-600">{item.description}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
