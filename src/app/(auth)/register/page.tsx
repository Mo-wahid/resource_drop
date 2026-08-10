import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/crypto/tokens";
import { SetPasswordForm } from "@/components/auth/set-password-form";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ResourceDropLogo } from "@/components/icons/resource-drop-logo";
import { siteConfig } from "@/config/site";

interface RegisterPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  // Wait for searchParams to resolve
  const params = await searchParams;
  const token = params.token as string | undefined;

  const renderHeader = () => (
    <div className="flex flex-col items-center mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-500">
      <ResourceDropLogo className="w-15 h-15 mb-4" />
      <h1 className="text-3xl text-white tracking-tight">
        <span className="font-light capitalize">{siteConfig.nameTop.toLowerCase()}</span><span className="font-bold capitalize">{siteConfig.nameBottom.toLowerCase()}</span>
      </h1>
      <p className="text-sm text-slate-400 mt-1.5">
        Activate your account
      </p>
    </div>
  );

  // 1. No token provided -> show "invite only" message
  if (!token) {
    return (
      <div className="w-full flex flex-col items-center">
        {renderHeader()}
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <Card className="rounded-card shadow-lg">
            <CardContent className="p-8 pt-8 flex flex-col gap-6 text-center">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold tracking-tight">Accounts are invite-only</h2>
                <p className="text-sm text-muted-foreground">
                  You need an invitation link to create an account on this platform.
                </p>
              </div>
              <Link href="/login" className={buttonVariants({ variant: "outline", className: "w-full rounded-input h-11" })}>
                Return to Login
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 2. Token provided -> validate it
  const tokenHash = hashToken(token);
  const invitation = await prisma.invitation.findUnique({
    where: { token: tokenHash },
  });

  // 3. Handle invalid states
  let errorMsg = null;
  if (!invitation) {
    errorMsg = "This invitation link is invalid.";
  } else if (invitation.status !== "PENDING") {
    errorMsg = "This invitation has already been used or revoked.";
  } else if (invitation.expiresAt < new Date()) {
    errorMsg = "This invitation has expired. Please contact your administrator for a new one.";
  }

  if (errorMsg || !invitation) {
    return (
      <div className="w-full flex flex-col items-center">
        {renderHeader()}
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <Card className="rounded-card shadow-lg border-destructive/20">
            <CardContent className="p-8 pt-8 flex flex-col gap-6 text-center">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold tracking-tight text-destructive">Invalid Invitation</h2>
                <p className="text-sm text-muted-foreground">{errorMsg}</p>
              </div>
              <Link href="/login" className={buttonVariants({ variant: "outline", className: "w-full rounded-input h-11" })}>
                Return to Login
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 5. Render the form inside the aesthetic card
  return (
    <div className="w-full flex flex-col items-center">
      {renderHeader()}
      <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <Card className="rounded-card shadow-lg">
          <CardContent className="p-8 pt-8">
             <SetPasswordForm rawToken={token} email={invitation.email} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
