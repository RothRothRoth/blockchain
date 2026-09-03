"use client";

import Link from "next/link";
import { Certificate } from "@/lib/types";
import { getCertificateStatus } from "@/lib/certificate-status";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";

interface CertificateTableProps {
  certificates: Certificate[];
  showActions?: boolean;
  onRevoke?: (certificateId: string) => void;
  emptyMessage?: string;
}

export function CertificateTable({
  certificates,
  showActions = true,
  onRevoke,
  emptyMessage = "No certificates found.",
}: CertificateTableProps) {
  if (certificates.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-sm text-slate-500">{emptyMessage}</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3">Certificate ID</th>
            <th className="px-5 py-3">Recipient</th>
            <th className="px-5 py-3">Title</th>
            <th className="px-5 py-3">Issue Date</th>
            <th className="px-5 py-3">Expiration Date</th>
            <th className="px-5 py-3">Status</th>
            {showActions && <th className="px-5 py-3">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {certificates.map((cert) => {
            const status = getCertificateStatus(cert);
            return (
              <tr key={cert.certificateId} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-600">
                  {cert.certificateNumber}
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-slate-900">
                  {cert.recipientName}
                </td>
                <td className="px-5 py-3 text-slate-700">{cert.certificateTitle}</td>
                <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                  {formatDate(cert.issueDate)}
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                  {formatDate(cert.expirationDate)}
                </td>
                <td className="whitespace-nowrap px-5 py-3">
                  <StatusBadge status={status} />
                </td>
                {showActions && (
                  <td className="whitespace-nowrap px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/certificates/${cert.certificateId}`}
                        className="text-sm font-medium text-teal-700 hover:text-teal-800"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        disabled
                        title="PDF download will be available once PDF generation is connected"
                        className="text-sm font-medium text-slate-300 cursor-not-allowed"
                      >
                        Download
                      </button>
                      {status !== "revoked" && onRevoke && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!px-0 text-red-600 hover:bg-transparent hover:text-red-700"
                          onClick={() => onRevoke(cert.certificateId)}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
