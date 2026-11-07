import { auth } from "@/auth";
import {
  addTemplate,
  addWatcher,
  assignSlot,
  claimWatcher,
  createInvite,
  getUserByGoogleSub,
  removeTemplate,
  removeWatcher,
  renameWatcher,
  revokeInvite,
  updateTemplate,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

type Action =
  | { type: "addWatcher"; name: string }
  | { type: "renameWatcher"; id: string; name: string }
  | { type: "removeWatcher"; id: string }
  | { type: "claimWatcher"; watcherId: string | null }
  | { type: "updateTemplate"; id: string; name?: string; startTime?: string; endTime?: string }
  | { type: "addTemplate"; name: string; startTime: string; endTime: string }
  | { type: "removeTemplate"; id: string }
  | { type: "assignSlot"; weekStart: string; dayOfWeek: number; templateId: string; watcherId: string | null }
  | { type: "createInvite"; watcherId?: string | null }
  | { type: "revokeInvite"; id: string };

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const req = new URL(request.url);
    const orig = new URL(origin);
    if (orig.host === req.host) return true;
    const loopback = new Set(["localhost", "127.0.0.1"]);
    return orig.port === req.port && loopback.has(orig.hostname) && loopback.has(req.hostname);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const session = await auth();
  if (!session?.user?.googleSub) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const me = await getUserByGoogleSub(session.user.googleSub);
  if (!me) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: Action;
  try {
    body = (await request.json()) as Action;
  } catch {
    return Response.json({ error: "invalid-json" }, { status: 400 });
  }
  const admin = me.isAdmin;
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
          template: await addTemplate(body.name, body.startTime, body.endTime),
        });
      case "removeTemplate":
        if (!admin) return Response.json({ error: "forbidden" }, { status: 403 });
        await removeTemplate(body.id);
        return Response.json({ ok: true });
      case "assignSlot":
        await assignSlot(body.weekStart, body.dayOfWeek, body.templateId, body.watcherId);
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
      default:
        return Response.json({ error: "unknown-action" }, { status: 400 });
    }
  } catch (error) {
    const code = error instanceof Error ? error.message : "error";
    const safe = code === "name-required" || code === "taken" || code === "invalid" ? code : "error";
    return Response.json({ error: safe }, { status: 400 });
  }
}
