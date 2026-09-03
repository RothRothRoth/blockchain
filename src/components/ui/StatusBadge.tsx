import { CertificateStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/certificate-status";

const STATUS_CLASSES: Record<CertificateStatus, string> = {
  valid: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20",
  expired: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20",
  revoked: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
};

const STATUS_DOT: Record<CertificateStatus, string> = {
  valid: "bg-green-500",
  expired: "bg-slate-400",
  revoked: "bg-red-500",
};

export function StatusBadge({ status }: { status: CertificateStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}
