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
  onReactivate?: (certificateId: string) => void;
  emptyMessage?: string;
}

export function CertificateTable({
  certificates,
  showActions = true,
  onRevoke,
  onReactivate,
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
          <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-bold uppercase tracking-wider text-slate-700">
            <th className="px-5 py-3.5">Certificate ID</th>
            <th className="px-5 py-3.5">Recipient</th>
            <th className="px-5 py-3.5">Title</th>
            <th className="px-5 py-3.5">Issue Date</th>
            <th className="px-5 py-3.5">Expiration Date</th>
            <th className="px-5 py-3.5">Status</th>
            {showActions && <th className="px-5 py-3.5">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {certificates.map((cert) => {
            const status = getCertificateStatus(cert);
            return (
              <tr key={cert.certificateId} className="hover:bg-slate-50/80 transition-colors">
                <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs font-semibold text-slate-800">
                  {cert.certificateNumber}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-950">
                  {cert.recipientName}
                </td>
                <td className="px-5 py-3.5 font-medium text-slate-800">{cert.certificateTitle}</td>
                <td className="whitespace-nowrap px-5 py-3.5 font-medium text-slate-700">
                  {formatDate(cert.issueDate)}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 font-medium text-slate-700">
                  {formatDate(cert.expirationDate)}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5">
                  <StatusBadge status={status} />
                </td>
                {showActions && (
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/certificates/${cert.certificateId}`}
                        className="text-sm font-semibold text-teal-800 hover:text-teal-950 underline underline-offset-2"
                      >
                        View
                      </Link>
                      <a
                        href={`/certificates/${cert.certificateId}/pdf`}
                        className="text-sm font-semibold text-teal-800 hover:text-teal-950 underline underline-offset-2"
                      >
                        Download
                      </a>
                      {status !== "revoked" && onRevoke && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!px-0 font-semibold text-red-600 hover:bg-transparent hover:text-red-800"
                          onClick={() => onRevoke(cert.certificateId)}
                        >
                          Revoke
                        </Button>
                      )}
                      {status === "revoked" && onReactivate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!px-0 font-semibold text-teal-700 hover:bg-transparent hover:text-teal-900"
                          onClick={() => onReactivate(cert.certificateId)}
                        >
                          Reactivate
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
