import { safeAuth } from "@/auth";
import { LIVE_HOST } from "@/lib/auth-mode";
import {
  addTemplate,
  addWatcher,
  assignSlot,
  claimWatcher,
  createInvite,
  ensureAllowlistedAdmin,
  getUserByGoogleSub,
  isAllowlistedAdminEmail,
  setMemberAdmin,
  upsertDayNote,
  removeTemplate,
  removeWatcher,
  renameWatcher,
  revokeInvite,
  updateTemplate,
} from "@/lib/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Action =
  | { type: "addWatcher"; name: string }
  | { type: "renameWatcher"; id: string; name: string }
  | { type: "removeWatcher"; id: string }
  | { type: "claimWatcher"; watcherId: string | null }
  | { type: "updateTemplate"; id: string; name?: string; startTime?: string; endTime?: string; days?: number[] }
  | { type: "addTemplate"; name: string; startTime: string; endTime: string; days?: number[] }
  | { type: "removeTemplate"; id: string }
  | { type: "assignSlot"; weekStart: string; dayOfWeek: number; templateId: string; watcherId: string | null }
  | { type: "setDayNote"; weekStart: string; dayOfWeek: number; body: string }
  | { type: "createInvite"; watcherId?: string | null }
  | { type: "revokeInvite"; id: string }
  | { type: "setMemberAdmin"; userId: string; isAdmin: boolean };

function headerHosts(request: Request): string[] {
  const values = [
    request.headers.get("x-forwarded-host"),
    request.headers.get("host"),
  ];
  try {
    values.push(new URL(request.url).host);
  } catch {
    /* ignore */
  }
  return values
    .flatMap((value) => (value ?? "").split(","))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const orig = new URL(origin);
    const origHost = orig.host.toLowerCase();
    const allowed = new Set([...headerHosts(request), LIVE_HOST, `www.${LIVE_HOST}`]);
    if (allowed.has(origHost)) return true;
    const loopback = new Set(["localhost", "127.0.0.1"]);
    return [...allowed].some((host) => {
      const hostname = host.split(":")[0];
      return loopback.has(orig.hostname) && loopback.has(hostname);
    });
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const session = await safeAuth();
  if (!session?.user?.googleSub) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const member =
    (await getUserByGoogleSub(session.user.googleSub)) ??
    (await ensureAllowlistedAdmin({
      googleSub: session.user.googleSub,
      email: session.user.email,
      name: session.user.name,
    }));
  if (!member) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const me =
    member.isAdmin || !isAllowlistedAdminEmail(member.email)
      ? member
      : (await ensureAllowlistedAdmin({
          googleSub: session.user.googleSub,
          email: member.email,
          name: member.name,
        })) ?? member;
  let body: Action;
  try {
    body = (await request.json()) as Action;
  } catch {
    return Response.json({ error: "invalid-json" }, { status: 400 });
  }
  const admin = me.isAdmin || isAllowlistedAdminEmail(me.email);
  try {
    switch (body.type) {
      case "addWatcher":
        if (!admin) return Response.json({ error: "forbidden" }, { status: 403 });
        return Response.json({ watcher: await addWatcher(body.name) });
      case "renameWatcher":
        if (!admin) return Response.json({ error: "forbidden" }, { status: 403 });
        await renameWatcher(body.id, body.name);
        return Response.json({ ok: true });
      case "removeWatcher":
        if (!admin) return Response.json({ error: "forbidden" }, { status: 403 });
        await removeWatcher(body.id);
        return Response.json({ ok: true });
      case "claimWatcher":
        await claimWatcher(me.id, body.watcherId);
        return Response.json({ ok: true });
      case "updateTemplate":
        if (!admin) return Response.json({ error: "forbidden" }, { status: 403 });
        await updateTemplate(body.id, body);
        return Response.json({ ok: true });
      case "addTemplate":
        if (!admin) return Response.json({ error: "forbidden" }, { status: 403 });
        return Response.json({
          template: await addTemplate(body.name, body.startTime, body.endTime, body.days),
        });
      case "removeTemplate":
        if (!admin) return Response.json({ error: "forbidden" }, { status: 403 });
        await removeTemplate(body.id);
        return Response.json({ ok: true });
      case "assignSlot":
        await assignSlot(body.weekStart, body.dayOfWeek, body.templateId, body.watcherId);
        return Response.json({ ok: true });
      case "setDayNote":
        await upsertDayNote(body.weekStart, body.dayOfWeek, body.body);
        return Response.json({ ok: true });
      case "createInvite":
        if (!admin) return Response.json({ error: "forbidden" }, { status: 403 });
        return Response.json({
          invite: await createInvite(me.id, body.watcherId ?? null),
        });
      case "revokeInvite":
        if (!admin) return Response.json({ error: "forbidden" }, { status: 403 });
        await revokeInvite(body.id);
        return Response.json({ ok: true });
      case "setMemberAdmin":
        if (!admin) return Response.json({ error: "forbidden" }, { status: 403 });
        await setMemberAdmin(body.userId, Boolean(body.isAdmin));
        return Response.json({ ok: true });
      default:
        return Response.json({ error: "unknown-action" }, { status: 400 });
    }
  } catch (error) {
    const code = error instanceof Error ? error.message : "error";
    const safe =
      code === "name-required" ||
      code === "taken" ||
      code === "invalid" ||
      code === "last-admin" ||
      code === "note-too-long"
        ? code
        : "error";
    return Response.json({ error: safe }, { status: 400 });
  }
}
