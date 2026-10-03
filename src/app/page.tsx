import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { CertificateMockup } from "@/components/certificates/CertificateMockup";
import {
  BankIcon,
  QrIcon,
  SearchIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ShieldIcon,
  GlobeIcon,
} from "@/components/ui/icons";

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-teal-700" fill="none">
      <path
        d="M9 15 15 9M8 12 6 14a3.5 3.5 0 0 0 5 5l2-2M16 12l2-2a3.5 3.5 0 0 0-5-5l-2 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DocumentLockIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
        stroke="#0f4c46"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 11h6M9 14h4" stroke="#0f4c46" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17.5" cy="17.5" r="5" fill="#0f4c46" />
      <rect x="15.5" y="17" width="4" height="3" rx="0.6" fill="#fff" />
      <path
        d="M16.3 17v-0.9a1.2 1.2 0 1 1 2.4 0V17"
        stroke="#fff"
        strokeWidth="0.9"
        fill="none"
      />
    </svg>
  );
}

function FloatingBadge({
  icon,
  title,
  subtitle,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <div
      className={`absolute hidden w-48 items-start gap-2.5 rounded-xl border border-slate-100 bg-white p-3 shadow-lg sm:flex ${className}`}
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 text-[11px] text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

const TIMELINE = [
  {
    number: "01",
    icon: <DocumentLockIcon />,
    label: "Issued",
    description: "Certificate is securely created and recorded on the blockchain.",
  },
  {
    number: "02",
    icon: <CheckCircleIcon className="h-7 w-7 text-teal-700" />,
    label: "Verified",
    description: "Instant verification confirms authenticity in seconds.",
  },
  {
    number: "03",
    icon: <GlobeIcon className="h-7 w-7 text-teal-700" />,
    label: "Public",
    description: "Anyone, anywhere can verify it, openly and transparently.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="text-lg font-semibold tracking-tight text-slate-900">Certi</span>
          </div>
          <nav className="hidden items-center gap-8 sm:flex">
            <Link
              href="/verify"
              className="text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Verify Certificate
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              About
            </Link>
          </nav>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-teal-700/30 px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50"
          >
            <BankIcon />
            Institution Login
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-100 via-teal-50 to-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(#0f4c4633_1.5px,transparent_1.5px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-teal-300/50 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 top-10 h-[28rem] w-[28rem] rounded-full bg-emerald-300/50 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-1/4 bottom-0 h-72 w-72 translate-y-1/2 rounded-full bg-teal-200/40 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-16 lg:pt-20">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div>
              <h1 className="text-5xl font-bold tracking-tight text-slate-900">
                Certificates you can trust.
                <br />
                <span className="text-teal-700">Verified in seconds.</span>
              </h1>

              <p className="mt-5 max-w-md text-base leading-relaxed text-slate-500">
                Issue tamper-resistant digital certificates and let anyone verify their
                authenticity instantly. Powered by blockchain technology for a safer, more
                transparent record.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <LinkButton
                  href="/verify"
                  size="md"
                  className="!justify-between !px-5 !py-3"
                >
                  <span className="flex items-center gap-2">
                    <SearchIcon />
                    Verify a Certificate
                  </span>
                  <ArrowRightIcon />
                </LinkButton>
                <LinkButton
                  href="/login"
                  variant="secondary"
                  size="md"
                  className="!justify-between !px-5 !py-3"
                >
                  <span className="flex items-center gap-2">
                    <BankIcon />
                    For Institutions
                  </span>
                  <ArrowRightIcon />
                </LinkButton>
              </div>

              <Link
                href="/verify"
                className="mt-4 flex items-center gap-2 text-xs text-slate-400 hover:text-teal-700"
              >
                <QrIcon />
                Have a QR code? Scan it to verify instantly.
              </Link>
            </div>

            <div className="relative mx-auto w-full max-w-sm py-6 lg:max-w-none">
              <div className="absolute right-2 top-8 hidden h-[285px] w-[380px] rotate-6 rounded-2xl bg-teal-800 sm:block" />

              <div className="relative mx-auto w-[380px] max-w-full overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl">
                <CertificateMockup
                  recipientName="John Doe"
                  certificateTitle="Web Development"
                  organizationName="Metro Technical Institute"
                  certificateNumber="CERT-2026-00128"
                  issuedBy="Dr. Jane Smith"
                  issueDate="2026-06-15"
                />
              </div>

              <FloatingBadge
                icon={<LinkIcon />}
                title="Recorded on Blockchain"
                subtitle="0x8f2a...91ac"
                className="-left-12 top-24"
              />
              <FloatingBadge
                icon={<CheckCircleIcon />}
                title="Verified"
                subtitle="Blockchain Record Found"
                className="-right-10 -top-2"
              />
              <FloatingBadge
                icon={<ShieldIcon />}
                title="Tamper-Proof"
                subtitle="Immutable Record"
                className="-right-12 -bottom-6"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-slate-100 bg-white py-24">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
            Built on Trust
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
            Trust isn&apos;t claimed. It&apos;s <span className="text-teal-600">proven.</span>
          </h2>
          <p className="mt-3 text-base text-slate-500">
            Every certificate follows a secure and transparent process from issuance to
            verification.
          </p>

          <div className="mt-16 grid grid-cols-1 gap-14 sm:grid-cols-3 sm:gap-8">
            {TIMELINE.map((step, i) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                <div className="relative mb-6 flex h-6 w-full items-center justify-center">
                  {i > 0 && (
                    <span className="absolute right-1/2 hidden h-0.5 w-full bg-slate-300 sm:block" />
                  )}
                  {i < TIMELINE.length - 1 && (
                    <span className="absolute left-1/2 hidden h-0.5 w-full bg-slate-300 sm:block" />
                  )}
                  <span className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                    <span className="text-sm font-bold text-teal-700">{step.number}</span>
                    <span className="h-2 w-2 rounded-full bg-teal-600" />
                  </span>
                </div>

                <span className="h-5 w-0.5 border-l-2 border-dashed border-slate-400" />
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-300 bg-white shadow-sm">
                  {step.icon}
                </div>
                <span className="h-5 w-0.5 border-l-2 border-dashed border-slate-400" />

                <p className="mt-2 text-sm font-bold uppercase tracking-wide text-slate-900">
                  {step.label}
                </p>
                <span className="mt-2 h-0.5 w-8 rounded bg-teal-500" />
                <p className="mt-3 max-w-[16rem] text-sm text-slate-500">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="relative mt-20 border-t-2 border-slate-300 pt-8">
            <div className="absolute left-1/2 top-0 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white">
              <ShieldIcon className="h-5 w-5 text-teal-700" />
            </div>
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-slate-500">
                <ShieldIcon className="h-4 w-4 text-teal-600" />
                Tamper-Proof &bull; Transparent &bull; Trusted
              </p>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700">
                  #
                </span>
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Blockchain ID
                  </p>
                  <p className="font-mono text-xs font-medium text-teal-700">
                    7F3A 9C21 B55E 2D7A
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-slate-900 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 text-xs text-slate-400 sm:flex-row">
          <span>© 2026 Certi, Kirirom Institute of Technology</span>
          <span>Blockchain-Based Digital Certificate Issuing Platform</span>
        </div>
      </footer>
    </div>
  );
}
