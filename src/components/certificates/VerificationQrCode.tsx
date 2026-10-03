/**
 * Renders the certificate's verification QR code as an actual scannable
 * image (server-generated via the `qrcode` package), encoding
 * `verificationUrl` directly — pointing a phone camera at it opens
 * `/verify/[certificateId]`.
 */
export function VerificationQrCode({
  qrDataUrl,
  verificationUrl,
}: {
  qrDataUrl: string;
  verificationUrl: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- data: URL, next/image can't optimize it */}
      <img
        src={qrDataUrl}
        alt={`QR code linking to ${verificationUrl}`}
        width={144}
        height={144}
        className="aspect-square h-36 w-36 max-w-none shrink-0 rounded-md border border-slate-200 bg-white object-contain p-2"
      />
      <a
        href={verificationUrl}
        className="max-w-[14rem] break-all text-center text-xs font-semibold text-teal-800 hover:text-teal-950 underline underline-offset-2"
      >
        {verificationUrl}
      </a>
    </div>
  );
}
