import { safeAuth } from "@/auth";
import { googleConfigured, isDevLoginEnabled } from "@/lib/auth-mode";
import { countUsers } from "@/lib/queries";
import { redirect } from "next/navigation";
import { LoginForm } from "./ui";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await safeAuth();
  if (session?.user?.id && !session.user.pending) redirect("/");
  const params = await searchParams;
  let firstUser = false;
  try {
    firstUser = (await countUsers()) === 0;
  } catch {
    firstUser = false;
  }
  return (
    <LoginForm
      google={googleConfigured()}
      dev={isDevLoginEnabled()}
      firstUser={firstUser}
      pending={Boolean(session?.user?.pending)}
      error={params.error ?? null}
      invite={null}
      redirectTo="/"
    />
  );
}
