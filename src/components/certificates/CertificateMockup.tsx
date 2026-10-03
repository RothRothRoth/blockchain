import localFont from "next/font/local";
import { formatDate } from "@/lib/format";

const scriptFont = localFont({
  src: "../../app/fonts/GreatVibes-subset.ttf",
  display: "swap",
});

const BLUE = "#133a9b";
const BLUE_DARK = "#0d296f";
const BLUE_LIGHT = "#5c85d1";
const INK = "#121729";
const SLATE = "#475569";

const W = 792;
const H = 612;
const CX = W / 2;

function Corner({ flipX, flipY }: { flipX: boolean; flipY: boolean }) {
  const inset = 38;
  const px = (x: number) => (flipX ? W - x : x);
  const py = (y: number) => (flipY ? H - y : y);
  const curve = (a: number, b: number) =>
    `M ${px(inset)} ${py(inset + b)} C ${px(inset)} ${py(inset + b * 0.45)} ${px(inset + b * 0.45)} ${py(inset)} ${px(inset + b)} ${py(inset)}` +
    ` M ${px(inset)} ${py(inset + a)} C ${px(inset)} ${py(inset + a * 0.5)} ${px(inset + a * 0.5)} ${py(inset)} ${px(inset + a)} ${py(inset)}`;
  return (
    <g>
      <path d={curve(34, 64)} fill="none" stroke={BLUE} strokeWidth={1.4} />
      <circle cx={px(inset + 4)} cy={py(inset + 4)} r={3.2} fill={BLUE} />
      <circle cx={px(inset + 72)} cy={py(inset)} r={1.8} fill={BLUE_LIGHT} />
      <circle cx={px(inset)} cy={py(inset + 72)} r={1.8} fill={BLUE_LIGHT} />
    </g>
  );
}

function Seal({ cx, cy }: { cx: number; cy: number }) {
  const ribbon = (dir: 1 | -1) => {
    const pts: [number, number][] = [
      [cx + dir * 4, cy + 18],
      [cx + dir * 26, cy + 14],
      [cx + dir * 30, cy + 66],
      [cx + dir * 17, cy + 55],
      [cx + dir * 6, cy + 67],
    ];
    return "M " + pts.map(([x, y]) => `${x} ${y}`).join(" L ") + " Z";
  };
  const star = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? 15 : 6.5;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
  });
  return (
    <g>
      <path d={ribbon(-1)} fill={BLUE_LIGHT} />
      <path d={ribbon(1)} fill={BLUE} />
      <circle cx={cx} cy={cy} r={37} fill={BLUE} />
      <circle cx={cx} cy={cy} r={31} fill="none" stroke="#fff" strokeWidth={1.2} />
      <circle cx={cx} cy={cy} r={27} fill={BLUE_DARK} />
      <path d={"M " + star.join(" L ") + " Z"} fill="#fff" />
    </g>
  );
}

/** Stand-in pattern used when no real QR image is supplied (landing page preview). */
function PlaceholderQr({ x, y, size }: { x: number; y: number; size: number }) {
  const n = 9;
  const cell = size / n;
  const on = (r: number, c: number) => {
    const finder = (r < 3 && c < 3) || (r < 3 && c >= n - 3) || (r >= n - 3 && c < 3);
    if (finder) return (r % 2 === 1 && c % 2 === 1 ? false : true);
    return (r * 7 + c * 5 + r * c) % 3 === 0;
  };
  return (
    <g>
      {Array.from({ length: n * n }).map((_, i) => {
        const r = Math.floor(i / n);
        const c = i % n;
        return on(r, c) ? (
          <rect key={i} x={x + c * cell} y={y + r * cell} width={cell} height={cell} fill="#0f172a" />
        ) : null;
      })}
    </g>
  );
}

interface CertificateMockupProps {
  recipientName: string;
  certificateTitle: string;
  organizationName: string;
  certificateNumber: string;
  /** Name shown under the left signature line. */
  issuedBy?: string;
  /** ISO date (YYYY-MM-DD). */
  issueDate?: string;
  /** Real QR image (data URL); a decorative pattern is drawn if omitted. */
  qrDataUrl?: string;
}

/**
 * On-screen preview of the certificate, drawn with the same layout as the
 * downloadable PDF (src/lib/pdf/certificate-pdf.ts) so what the institute
 * sees here matches what recipients receive. Used on the landing page with
 * placeholder data and on the dashboard with the real latest certificate.
 */
export function CertificateMockup({
  recipientName,
  certificateTitle,
  organizationName,
  certificateNumber,
  issuedBy = "Authorized Signatory",
  issueDate,
  qrDataUrl,
}: CertificateMockupProps) {
  const nameSize = Math.max(26, Math.min(54, 560 / (Math.max(recipientName.length, 1) * 0.42)));
  const orgSize = Math.max(8, Math.min(13, 180 / (Math.max(organizationName.length, 1) * 0.58)));
  const issuerSize = Math.max(8, Math.min(13, 180 / (Math.max(issuedBy.length, 1) * 0.58)));
  const dateText = issueDate ? formatDate(issueDate, "long") : null;
  const qrX = W - 112 - 82;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block h-auto w-full bg-white"
      role="img"
      aria-label={`Certificate preview for ${recipientName}: ${certificateTitle}`}
      fontFamily="Helvetica, Arial, sans-serif"
    >
      <rect x={18} y={18} width={W - 36} height={H - 36} fill="none" stroke={BLUE} strokeWidth={2.5} />
      <rect x={28} y={28} width={W - 56} height={H - 56} fill="none" stroke={BLUE} strokeWidth={0.8} />
      <Corner flipX={false} flipY={false} />
      <Corner flipX={true} flipY={false} />
      <Corner flipX={false} flipY={true} />
      <Corner flipX={true} flipY={true} />

      <text x={CX} y={112} textAnchor="middle" fontSize={27} fontWeight={700} letterSpacing={2.2} fill={BLUE}>
        CERTIFICATE OF COMPLETION
      </text>
      <line x1={CX - 70} y1={126} x2={CX + 70} y2={126} stroke={BLUE_LIGHT} strokeWidth={1} />
      <circle cx={CX} cy={126} r={2.4} fill={BLUE} />

      <text x={CX} y={160} textAnchor="middle" fontSize={13} fill={INK}>
        This Certificate is awarded to
      </text>
      <text
        x={CX}
        y={226}
        textAnchor="middle"
        fontSize={nameSize}
        fill={BLUE}
        style={{ fontFamily: scriptFont.style.fontFamily }}
      >
        {recipientName}
      </text>

      <foreignObject x={136} y={258} width={520} height={80}>
        <div
          style={{
            fontSize: 11.5,
            lineHeight: "16px",
            color: SLATE,
            textAlign: "center",
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          In recognition of the successful completion of &ldquo;{certificateTitle}&rdquo;. This
          certificate was issued by {organizationName}
          {dateText ? ` on ${dateText}` : ""}. Its authenticity can be confirmed at any time by
          scanning the QR code or by entering the Certificate ID on the verification page.
        </div>
      </foreignObject>

      <line x1={70} y1={390} x2={234} y2={390} stroke={SLATE} strokeWidth={0.9} />
      <text x={152} y={407} textAnchor="middle" fontSize={issuerSize} fontWeight={700} fill={BLUE_DARK}>
        {issuedBy}
      </text>
      <text x={152} y={421} textAnchor="middle" fontSize={9.5} fill={SLATE}>
        Issued By
      </text>
      <line x1={W - 234} y1={390} x2={W - 70} y2={390} stroke={SLATE} strokeWidth={0.9} />
      <text x={W - 152} y={407} textAnchor="middle" fontSize={orgSize} fontWeight={700} fill={BLUE_DARK}>
        {organizationName}
      </text>
      <text x={W - 152} y={421} textAnchor="middle" fontSize={9.5} fill={SLATE}>
        Issuing Institution
      </text>
      <Seal cx={CX} cy={H - 228} />

      <text x={60} y={H - 130 + 0} fontSize={7.5} fontWeight={700} letterSpacing={0.8} fill={BLUE} dy={0}>
        CERTIFICATE ID
      </text>
      <text x={60} y={H - 112} fontSize={15} fontWeight={700} fill={INK} fontFamily="Courier New, monospace">
        {certificateNumber}
      </text>
      {dateText && (
        <text x={60} y={H - 94} fontSize={9} fill={SLATE}>
          {`Issue Date: ${dateText}`}
        </text>
      )}

      {qrDataUrl ? (
        <image href={qrDataUrl} x={qrX} y={H - 58 - 82} width={82} height={82} />
      ) : (
        <PlaceholderQr x={qrX + 6} y={H - 58 - 82 + 6} size={70} />
      )}
      <rect x={qrX} y={H - 58 - 82} width={82} height={82} fill="none" stroke={BLUE_LIGHT} strokeWidth={0.8} />
      <text x={qrX + 41} y={H - 47} textAnchor="middle" fontSize={7} fontWeight={700} letterSpacing={1} fill={BLUE}>
        SCAN TO VERIFY
      </text>
    </svg>
  );
}
