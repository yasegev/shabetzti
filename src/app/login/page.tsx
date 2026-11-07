import { auth } from "@/auth";
import { googleConfigured, isDevLoginEnabled } from "@/lib/auth-mode";
import { countUsers } from "@/lib/queries";
import { redirect } from "next/navigation";
import { LoginForm } from "./ui";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user?.id && !session.user.pending) redirect("/");
  const params = await searchParams;
  const firstUser = (await countUsers()) === 0;
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
