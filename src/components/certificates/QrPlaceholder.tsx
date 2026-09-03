/**
 * Layout placeholder for the certificate's verification QR code. Renders a
 * generic, non-scannable pattern purely so the details page can be built and
 * reviewed before the real QR generation service (section 10, phase 2) is
 * wired in — it does not encode `verificationUrl` and is not a functional
 * code.
 */
export function QrPlaceholder({ verificationUrl }: { verificationUrl: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="grid h-32 w-32 grid-cols-5 grid-rows-5 gap-1 rounded-md border border-slate-200 bg-white p-2">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className={
              [0, 1, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21, 23, 24, 12].includes(i)
                ? "rounded-[1px] bg-slate-800"
                : "rounded-[1px] bg-transparent"
            }
          />
        ))}
      </div>
      <p className="max-w-[14rem] break-all text-center text-xs text-slate-500">
        {verificationUrl}
      </p>
    </div>
  );
}
