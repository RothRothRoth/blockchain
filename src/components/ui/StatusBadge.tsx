import { CertificateStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/certificate-status";

const STATUS_CLASSES: Record<CertificateStatus, string> = {
  valid: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/30",
  expired: "bg-slate-100 text-slate-800 ring-1 ring-inset ring-slate-400/40",
  revoked: "bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-600/30",
};

const STATUS_DOT: Record<CertificateStatus, string> = {
  valid: "bg-emerald-600",
  expired: "bg-slate-500",
  revoked: "bg-rose-600",
};

export function StatusBadge({ status }: { status: CertificateStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}
