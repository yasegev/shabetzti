import { safeAuth } from "@/auth";
import { googleConfigured, isDevLoginEnabled } from "@/lib/auth-mode";
import {
  ensureAllowlistedAdmin,
  getUserByGoogleSub,
  isAllowlistedAdminEmail,
  listAssignments,
  listInvites,
  listMembers,
  listTemplates,
  listWatchers,
} from "@/lib/queries";
import { parseWeekStart } from "@/lib/week";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await safeAuth();
  if (!session?.user?.googleSub) {
    return Response.json(
      { error: "unauthorized", pending: Boolean(session?.user?.pending) },
      { status: 401, headers: { "cache-control": "private, no-store" } },
    );
  }
  let me = await getUserByGoogleSub(session.user.googleSub);
  if (!me) {
    me = await ensureAllowlistedAdmin({
      googleSub: session.user.googleSub,
      email: session.user.email,
      name: session.user.name,
    });
  } else if (!me.isAdmin && isAllowlistedAdminEmail(me.email)) {
    me =
      (await ensureAllowlistedAdmin({
        googleSub: session.user.googleSub,
        email: me.email,
        name: me.name,
      })) ?? { ...me, isAdmin: true };
  }
  if (!me) {
    return Response.json(
      { error: "unauthorized", pending: true },
      { status: 401, headers: { "cache-control": "private, no-store" } },
    );
  }
  const admin = me.isAdmin || isAllowlistedAdminEmail(me.email);
  me = admin ? { ...me, isAdmin: true } : me;
  const url = new URL(request.url);
  const weekStart = parseWeekStart(url.searchParams.get("week"));
  const [watchers, templates, assignments, invites, members] = await Promise.all([
    listWatchers(),
    listTemplates(),
    listAssignments(weekStart),
    admin ? listInvites() : Promise.resolve([]),
    admin ? listMembers() : Promise.resolve([]),
  ]);
  return Response.json(
    {
      me,
      watchers,
      templates,
      assignments,
      invites,
      members,
      weekStart,
      googleConfigured: googleConfigured(),
      authMode: isDevLoginEnabled() ? "local-mock" : "google",
    },
    { headers: { "cache-control": "private, no-store" } },
  );
}
