import { safeAuth } from "@/auth";
import { LoginForm } from "@/app/login/ui";
import { googleConfigured, isDevLoginEnabled } from "@/lib/auth-mode";
import { consumeInvite, getInviteByToken } from "@/lib/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let invite: Awaited<ReturnType<typeof getInviteByToken>> = null;
  try {
    invite = await getInviteByToken(token);
  } catch {
    invite = null;
  }
  const session = await safeAuth();

  if (!invite) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <h1>שבצתי</h1>
          <p className="error">קישור ההזמנה לא תקף.</p>
          <p><a href="/login">חזרה לכניסה</a></p>
        </div>
      </div>
    );
  }
  if (invite.usedAt && (!session?.user?.id || invite.usedBy !== session.user.id)) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <h1>שבצתי</h1>
          <p className="error">קישור ההזמנה כבר נוצל.</p>
          <p><a href="/login">חזרה לכניסה</a></p>
        </div>
      </div>
    );
  }

  if (session?.user?.id && !session.user.pending) {
    redirect("/");
  }

  if (session?.user?.googleSub) {
    try {
      const joined = await consumeInvite(token, {
        googleSub: session.user.googleSub,
        email: session.user.email,
        name: session.user.name,
      });
      if (joined.ok) {
        redirect("/");
      }
    } catch {
      /* show the login form so they can retry */
    }
  }

  return (
    <LoginForm
      google={googleConfigured()}
      dev={isDevLoginEnabled()}
      firstUser={false}
      pending={Boolean(session?.user?.pending)}
      error={null}
      invite={token}
      redirectTo={`/invite/${token}`}
    />
  );
}
