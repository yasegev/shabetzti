import { auth } from "@/auth";
import { googleConfigured, isDevLoginEnabled } from "@/lib/auth-mode";
import {
  getUserByGoogleSub,
  listAssignments,
  listInvites,
  listMembers,
  listTemplates,
  listWatchers,
} from "@/lib/queries";
import { parseWeekStart } from "@/lib/week";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.googleSub) {
    return Response.json(
      { error: "unauthorized", pending: Boolean(session?.user?.pending) },
      { status: 401, headers: { "cache-control": "private, no-store" } },
    );
  }
  const me = await getUserByGoogleSub(session.user.googleSub);
  if (!me) {
    return Response.json(
      { error: "unauthorized", pending: true },
      { status: 401, headers: { "cache-control": "private, no-store" } },
    );
  }
  const url = new URL(request.url);
  const weekStart = parseWeekStart(url.searchParams.get("week"));
  const [watchers, templates, assignments, invites, members] = await Promise.all([
    listWatchers(),
    listTemplates(),
    listAssignments(weekStart),
    me.isAdmin ? listInvites() : Promise.resolve([]),
    me.isAdmin ? listMembers() : Promise.resolve([]),
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
