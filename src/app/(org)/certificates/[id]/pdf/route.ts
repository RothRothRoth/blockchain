import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCertificateById } from "@/lib/db/certificates";
import { generateQrCodeDataUrl } from "@/lib/qrcode";
import { generateCertificatePdf } from "@/lib/pdf/certificate-pdf";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const certificate = await getCertificateById(id);
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
