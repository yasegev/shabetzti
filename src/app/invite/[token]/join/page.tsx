import { LoginForm } from "@/app/login/ui";
import { safeAuth } from "@/auth";
import { googleConfigured, isDevLoginEnabled } from "@/lib/auth-mode";
import { consumeInvite, getInviteByToken } from "@/lib/queries";
import { connection } from "next/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const runtime = "nodejs";

export default async function InviteJoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await connection();
  const raw = (await params).token;
  const token = decodeURIComponent(Array.isArray(raw) ? raw[0] : raw).trim();
  const session = await safeAuth();
  if (!session?.user?.googleSub) {
    redirect(`/invite/${token}`);
  }

  if (session.user.pending) {
    let joined: Awaited<ReturnType<typeof consumeInvite>> | null = null;
    try {
      joined = await consumeInvite(token, {
        googleSub: session.user.googleSub,
        email: session.user.email,
        name: session.user.name,
      });
    } catch (error) {
      console.error("[shabetzti:invite-join]", error instanceof Error ? error.name : "error");
    }
    if (joined?.ok) {
      redirect("/");
    }
    return (
      <LoginForm
        google={googleConfigured()}
        dev={isDevLoginEnabled()}
        firstUser={false}
        pending
        error="invite"
        invite={token}
        redirectTo={`/invite/${token}/join`}
      />
    );
  }

  const invite = await getInviteByToken(token);
  if (invite?.usedBy === session.user.id) {
    redirect("/");
  }
  redirect(`/invite/${token}`);
}
