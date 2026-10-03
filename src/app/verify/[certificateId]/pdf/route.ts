import { NextRequest, NextResponse } from "next/server";
import { getCertificateById } from "@/lib/db/certificates";
import { generateQrCodeDataUrl } from "@/lib/qrcode";
import { generateCertificatePdf } from "@/lib/pdf/certificate-pdf";

/**
 * Public download, no login required — the recipient of a certificate (and
 * anyone else who has its ID or QR code) should be able to save it, the same
 * way institutions can from their dashboard. Mirrors
 * (org)/certificates/[id]/pdf/route.ts but without the auth check.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ certificateId: string }> }
) {
  const { certificateId } = await params;
  const certificate = await getCertificateById(certificateId);
  if (!certificate) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  const qrDataUrl = await generateQrCodeDataUrl(certificate.verificationUrl);
  const pdfBytes = await generateCertificatePdf(certificate, qrDataUrl);

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${certificate.certificateNumber}.pdf"`,
    },
  });
}
