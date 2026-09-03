import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LinkButton } from "@/components/ui/Button";
import { CertificateMockup } from "@/components/certificates/CertificateMockup";
import {
  DocumentIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldXIcon,
  FilePlusIcon,
  ListIcon,
  ShieldIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  listCertificatesByOrganization,
  getDashboardStats,
  getRecentActivity,
} from "@/lib/db/certificates";
import { getCertificateStatus } from "@/lib/certificate-status";
import { formatRelativeTime } from "@/lib/format";
import { DashboardStats } from "@/lib/types";

const STAT_CARDS: {
  key: keyof DashboardStats;
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
  iconBg: string;
  iconColor: string;
}[] = [
  { key: "total", label: "Total Certificates", icon: DocumentIcon, iconBg: "bg-teal-50", iconColor: "text-teal-700" },
  { key: "valid", label: "Valid Certificates", icon: CheckCircleIcon, iconBg: "bg-green-50", iconColor: "text-green-600" },
  { key: "expired", label: "Expired Certificates", icon: ClockIcon, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
  { key: "revoked", label: "Revoked Certificates", icon: ShieldXIcon, iconBg: "bg-red-50", iconColor: "text-red-600" },
];

const QUICK_ACTIONS = [
  {
    href: "/certificates/issue",
    icon: FilePlusIcon,
    title: "Issue Certificate",
    description: "Create a new certificate",
  },
  {
    href: "/certificates",
    icon: ListIcon,
    title: "View All Certificates",
    description: "Browse and manage certificates",
  },
  {
    href: "/verify",
    icon: ShieldIcon,
    title: "Verification Page",
    description: "Go to public verification",
  },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const organizationId = currentUser.organization.organizationId;
  const [stats, certificates, activity] = await Promise.all([
    getDashboardStats(organizationId),
    listCertificatesByOrganization(organizationId),
    getRecentActivity(organizationId, 6),
  ]);
  const latest = certificates[0] ?? null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">{getGreeting()},</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          {currentUser.organization.organizationName}
        </h1>
        <span className="mt-2 block h-1 w-10 rounded bg-teal-600" />
        <p className="mt-3 text-sm text-slate-500">Here&apos;s your overview for today.</p>
      </div>

      {latest ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-teal-800 via-teal-900 to-emerald-950 p-6 shadow-lg lg:col-span-2">
            <div className="mx-auto max-w-xs rounded-xl bg-white p-4 shadow-xl">
              <CertificateMockup
                recipientName={latest.recipientName}
                certificateTitle={latest.certificateTitle}
                organizationName={latest.organizationName}
                certificateNumber={latest.certificateNumber}
              />
            </div>
          </div>
          <Card className="flex flex-col justify-center">
            <CardBody>
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                Latest issued
              </p>
              <p className="mt-3 truncate text-lg font-semibold text-slate-900">
                {latest.recipientName}
              </p>
              <p className="truncate text-sm text-slate-500">{latest.certificateTitle}</p>
              <div className="mt-4">
                <StatusBadge status={getCertificateStatus(latest)} />
              </div>
              <Link
                href={`/certificates/${latest.certificateId}`}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800"
              >
                View certificate
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </CardBody>
          </Card>
        </div>
      ) : (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
              <DocumentIcon className="h-5 w-5 text-teal-700" />
            </div>
            <p className="text-sm text-slate-500">
              No certificates issued yet. Issue your first one to see it here.
            </p>
            <LinkButton href="/certificates/issue" size="sm">
              Issue a Certificate
            </LinkButton>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.key}>
              <CardBody className="flex items-center gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="mt-0.5 text-2xl font-semibold text-slate-900">
                    {stats[stat.key]}
                  </p>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link
              href="/certificates"
              className="text-sm font-medium text-teal-700 hover:text-teal-800"
            >
              View all
            </Link>
          </CardHeader>
          {activity.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">No activity yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {activity.map((event) => (
                <div
                  key={`${event.type}-${event.certificateId}-${event.occurredAt}`}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      event.type === "issued" ? "bg-teal-50" : "bg-red-50"
                    }`}
                  >
                    {event.type === "issued" ? (
                      <FilePlusIcon className="h-4 w-4 text-teal-700" />
                    ) : (
                      <ShieldXIcon className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      Certificate {event.type === "issued" ? "issued to" : "revoked for"}{" "}
                      {event.recipientName}
                    </p>
                    <p className="truncate text-xs text-slate-500">{event.certificateTitle}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {formatRelativeTime(event.occurredAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <div className="space-y-1 p-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50">
                    <Icon className="h-4 w-4 text-teal-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{action.title}</p>
                    <p className="text-xs text-slate-500">{action.description}</p>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 shrink-0 text-slate-300" />
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
