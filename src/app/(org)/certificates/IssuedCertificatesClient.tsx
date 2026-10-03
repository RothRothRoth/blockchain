"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/FormField";
import { CertificateTable } from "@/components/certificates/CertificateTable";
import { RevokeModal } from "@/components/certificates/RevokeModal";
import { getCertificateStatus } from "@/lib/certificate-status";
import { Certificate, CertificateStatus } from "@/lib/types";
import { revokeCertificate, reactivateCertificate } from "@/lib/certificates/actions";

const STATUS_FILTERS: { value: CertificateStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "valid", label: "Valid" },
  { value: "expired", label: "Expired" },
  { value: "revoked", label: "Revoked" },
];

export function IssuedCertificatesClient({ certificates }: { certificates: Certificate[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CertificateStatus | "all">("all");
  const [pendingRevoke, setPendingRevoke] = useState<Certificate | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return certificates.filter((cert) => {
      const status = getCertificateStatus(cert);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!query) return true;
      return (
        cert.recipientName.toLowerCase().includes(query) ||
        cert.certificateNumber.toLowerCase().includes(query) ||
        cert.certificateTitle.toLowerCase().includes(query)
      );
    });
  }, [certificates, search, statusFilter]);

  async function handleConfirmRevoke() {
    if (!pendingRevoke) return;
    await revokeCertificate(pendingRevoke.certificateId);
    setPendingRevoke(null);
    startTransition(() => router.refresh());
  }

  function handleReactivate(certificateId: string) {
    startTransition(async () => {
      await reactivateCertificate(certificateId);
      router.refresh();
    });
  }

  return (
    <>
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Search by recipient, title, or certificate number…"
            className="sm:max-w-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CertificateStatus | "all")}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <CertificateTable
          certificates={filtered}
          onRevoke={(id) =>
            setPendingRevoke(certificates.find((c) => c.certificateId === id) ?? null)
          }
          onReactivate={handleReactivate}
        />
      </Card>

      <RevokeModal
        certificate={pendingRevoke}
        onCancel={() => setPendingRevoke(null)}
        onConfirm={handleConfirmRevoke}
      />
    </>
  );
}
