import Link from "next/link";
import { connection } from "next/server";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { GradientBackdrop } from "@/components/layout/GradientBackdrop";
import { Card, CardBody } from "@/components/ui/Card";
import { getRegistrationMode } from "@/lib/auth/registration";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  // The mode depends on environment variables, so decide per request rather
  // than freezing whatever it was when the app was built.
  await connection();
  const mode = getRegistrationMode();

  if (mode === "closed") {
    return (
      <div className="flex min-h-screen flex-col">
        <GradientBackdrop variant="vivid" />
        <PublicHeader />
        <main className="mx-auto flex w-full max-w-md flex-1 items-center px-6 py-12">
          <Card className="w-full">
            <CardBody className="space-y-3 text-center">
              <h1 className="text-lg font-semibold text-slate-900">Registration is closed</h1>
              <p className="text-sm text-slate-600">
                Institutions are set up by the platform administrator. If you represent an
                institution and need an account, please contact them.
              </p>
              <Link
                href="/login"
                className="inline-block text-sm font-semibold text-teal-800 underline underline-offset-2"
              >
                Already have an account? Log in
              </Link>
            </CardBody>
          </Card>
        </main>
      </div>
    );
  }

  return <RegisterForm requireInvite={mode === "invite"} />;
}
