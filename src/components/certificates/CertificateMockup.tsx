import { Logo } from "@/components/ui/Logo";

function SealIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none">
      <circle cx="12" cy="9" r="6" fill="#0f4c46" />
      <path
        d="m9 9 2 2 4-4.2"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.5 13.5 7 21l5-2.4 5 2.4-1.5-7.5" fill="#22c55e" />
    </svg>
  );
}

function MiniQr() {
  const filled = new Set([0, 1, 3, 4, 6, 8, 9, 11, 13, 15, 17, 19, 20, 22, 23]);
  return (
    <div className="grid h-11 w-11 grid-cols-5 grid-rows-5 gap-[1.5px] rounded bg-slate-900 p-1.5">
      {Array.from({ length: 25 }).map((_, i) => (
        <div key={i} className={filled.has(i) ? "rounded-[1px] bg-white" : ""} />
      ))}
    </div>
  );
}

interface CertificateMockupProps {
  recipientName: string;
  certificateTitle: string;
  organizationName: string;
  certificateNumber: string;
}

/**
 * Compact, illustrative preview of a certificate — used on the landing page
 * (with placeholder data) and the dashboard (with the org's real latest
 * certificate). Not the actual downloadable PDF layout, just a visual
 * summary card.
 */
export function CertificateMockup({
  recipientName,
  certificateTitle,
  organizationName,
  certificateNumber,
}: CertificateMockupProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center">
      <div className="flex items-center justify-center gap-2">
        <Logo size={22} />
        <span className="text-sm font-semibold text-slate-900">Certi</span>
      </div>
      <p className="mt-4 text-[10px] font-semibold tracking-widest text-slate-400">
        CERTIFICATE OF COMPLETION
      </p>
      <p className="mt-3 text-[11px] text-slate-400">This certifies that</p>
      <p className="mt-1 truncate font-serif text-2xl italic text-slate-900">{recipientName}</p>
      <div className="mx-auto mt-2 h-px w-28 bg-slate-200" />
      <p className="mt-3 text-[11px] text-slate-400">has successfully completed</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-900">{certificateTitle}</p>
      <p className="mt-3 text-[10px] text-slate-400">Issued by</p>
      <p className="truncate text-xs font-medium text-slate-700">{organizationName}</p>

      <div className="mt-5 flex items-end justify-between">
        <div className="text-left">
          <p className="text-[9px] text-slate-400">Certificate ID</p>
          <p className="truncate text-[10px] font-mono text-slate-600">{certificateNumber}</p>
        </div>
        <SealIcon />
        <MiniQr />
      </div>
    </div>
  );
}
