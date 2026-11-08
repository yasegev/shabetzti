import { LoginForm } from "@/app/login/ui";
import { googleConfigured, isDevLoginEnabled } from "@/lib/auth-mode";
import { getInviteByToken } from "@/lib/queries";
import { connection } from "next/server";

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const runtime = "nodejs";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await connection();
  const raw = (await params).token;
  const token = decodeURIComponent(Array.isArray(raw) ? raw[0] : raw).trim();
  let invite: Awaited<ReturnType<typeof getInviteByToken>> = null;
  try {
    invite = await getInviteByToken(token);
  } catch (error) {
    console.error("[shabetzti:invite]", error instanceof Error ? error.name : "error");
    return (
      <div className="login-wrap">
        <div className="login-card">
          <h1>שבצתי</h1>
          <p className="error">משהו השתבש בטעינת ההזמנה. נסו שוב.</p>
        </div>
      </div>
    );
  }

  if (!invite || invite.usedAt) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <h1>שבצתי</h1>
          <p className="error">{invite?.usedAt ? "קישור ההזמנה כבר נוצל." : "קישור ההזמנה לא תקף."}</p>
          <p>
            <a href="/login">חזרה לכניסה</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <LoginForm
      google={googleConfigured()}
      dev={isDevLoginEnabled()}
      firstUser={false}
      pending={false}
      error={null}
      invite={token}
      redirectTo={`/invite/${token}/join`}
    />
  );
}
