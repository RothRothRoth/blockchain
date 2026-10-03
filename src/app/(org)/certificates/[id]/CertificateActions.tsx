"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonBaseClasses, variantClasses, sizeClasses } from "@/components/ui/Button";
import { RevokeModal } from "@/components/certificates/RevokeModal";
import { ResendEmailButton } from "@/components/certificates/ResendEmailButton";
import { revokeCertificate, reactivateCertificate } from "@/lib/certificates/actions";
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
  const [reactivating, startReactivate] = useTransition();
  const [, startTransition] = useTransition();

  async function handleConfirm() {
    await revokeCertificate(certificate.certificateId);
    setConfirming(false);
    startTransition(() => router.refresh());
  }

  function handleReactivate() {
    startReactivate(async () => {
      await reactivateCertificate(certificate.certificateId);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-start gap-3">
      <a
        href={`/certificates/${certificate.certificateId}/pdf`}
        className={`${buttonBaseClasses} ${variantClasses.secondary} ${sizeClasses.md}`}
      >
        Download PDF
      </a>
      {status !== "revoked" && <ResendEmailButton certificateId={certificate.certificateId} />}
      {status === "revoked" ? (
        <Button variant="primary" onClick={handleReactivate} disabled={reactivating}>
          {reactivating ? "Reactivating…" : "Reactivate Certificate"}
        </Button>
      ) : (
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
