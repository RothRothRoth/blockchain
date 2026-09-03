"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { RevokeModal } from "@/components/certificates/RevokeModal";
import { revokeCertificate } from "@/lib/certificates/actions";
import { Certificate, CertificateStatus } from "@/lib/types";

export function CertificateActions({
  certificate,
  status,
}: {
  certificate: Certificate;
  status: CertificateStatus;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [, startTransition] = useTransition();

  async function handleConfirm() {
    await revokeCertificate(certificate.certificateId);
    setConfirming(false);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="secondary"
        disabled
        title="PDF download will be available once PDF generation is connected"
      >
        Download PDF
      </Button>
      {status !== "revoked" && (
        <Button variant="danger" onClick={() => setConfirming(true)}>
          Revoke Certificate
        </Button>
      )}

      <RevokeModal
        certificate={confirming ? certificate : null}
        onCancel={() => setConfirming(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
