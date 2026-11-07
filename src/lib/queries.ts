import { randomBytes } from "node:crypto";
import { sql } from "./db";
import { WATCHER_COLORS } from "./auth-mode";
import { runtimeEnv } from "./env";
import type { Assignment, Invite, Member, Template, Watcher } from "./types";

type UserRow = {
  id: string;
  google_sub: string;
  email: string;
  name: string;
  is_admin: boolean;
  watcher_id: string | null;
};

type WatcherRow = { id: string; name: string; color: string; sort_order: number };
type TemplateRow = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  sort_order: number;
};
type AssignmentRow = {
  id: string;
  week_start: string;
  day_of_week: number;
  template_id: string;
  watcher_id: string;
};
type InviteRow = {
  id: string;
  token: string;
  watcher_id: string | null;
  used_at: string | null;
  created_at: string;
  expires_at: string | null;
};

function asDate(value: string | Date | null): string | null {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function asIso(value: string | Date | null): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.toISOString();
}

function memberFrom(row: UserRow): Member {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    isAdmin: Boolean(row.is_admin),
    watcherId: row.watcher_id,
  };
}

export async function countUsers(): Promise<number> {
  const rows = await sql<{ n: string | number }>("select count(*)::int as n from users");
  return Number(rows[0]?.n ?? 0);
}

export async function getUserByGoogleSub(googleSub: string): Promise<Member | null> {
  const rows = await sql<UserRow>("select * from users where google_sub = $1", [googleSub]);
  return rows[0] ? memberFrom(rows[0]) : null;
}

export async function getUserById(id: string): Promise<Member | null> {
  const rows = await sql<UserRow>("select * from users where id = $1", [id]);
  return rows[0] ? memberFrom(rows[0]) : null;
}

export async function createUser(input: {
  googleSub: string;
  email: string;
  name: string;
  isAdmin: boolean;
  watcherId?: string | null;
}): Promise<Member> {
  const id = crypto.randomUUID();
  const rows = await sql<UserRow>(
    `insert into users (id, google_sub, email, name, is_admin, watcher_id)
     values ($1, $2, $3, $4, $5, $6)
     returning *`,
    [id, input.googleSub, input.email, input.name, input.isAdmin, input.watcherId ?? null],
  );
  return memberFrom(rows[0]);
}

export function ownerAdminEmails(): string[] {
  return runtimeEnv("ADMIN_EMAIL")
    .split(/[,;]+/)
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.includes("@"));
}

export function isAllowlistedAdminEmail(email: string): boolean {
  return ownerAdminEmails().includes(email.trim().toLowerCase());
}

/** Create or promote a member if their Google email is on ADMIN_EMAIL (comma-separated). */
export async function ensureAllowlistedAdmin(input: {
  googleSub: string;
  email: string;
  name: string;
}): Promise<Member | null> {
  const email = input.email.trim().toLowerCase();
  const existing = await getUserByGoogleSub(input.googleSub);
  if (!isAllowlistedAdminEmail(email)) return existing;
  if (existing) {
    if (existing.isAdmin && existing.email === email && existing.name === input.name) {
      return existing;
    }
    const rows = await sql<UserRow>(
      `update users
       set is_admin = true, email = $2, name = $3
       where id = $1
       returning *`,
      [existing.id, email, input.name],
    );
    return rows[0] ? memberFrom(rows[0]) : existing;
  }
  try {
    return await createUser({
      googleSub: input.googleSub,
      email,
      name: input.name,
      isAdmin: true,
    });
  } catch {
    const raced = await getUserByGoogleSub(input.googleSub);
    if (!raced) return null;
    if (raced.isAdmin) return raced;
    const rows = await sql<UserRow>(
      `update users set is_admin = true, email = $2, name = $3 where id = $1 returning *`,
      [raced.id, email, input.name],
    );
    return rows[0] ? memberFrom(rows[0]) : raced;
  }
}

export async function countAdmins(): Promise<number> {
  const rows = await sql<{ n: string | number }>(
    "select count(*)::int as n from users where is_admin = true",
  );
  return Number(rows[0]?.n ?? 0);
}

export async function setMemberAdmin(userId: string, isAdmin: boolean): Promise<void> {
  const target = await getUserById(userId);
  if (!target) throw new Error("invalid");
  if (!isAdmin && target.isAdmin && (await countAdmins()) <= 1) {
    throw new Error("last-admin");
  }
  await sql("update users set is_admin = $2 where id = $1", [userId, isAdmin]);
}

export async function listWatchers(): Promise<Watcher[]> {
  const rows = await sql<WatcherRow>("select * from watchers order by sort_order, created_at");
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    sortOrder: r.sort_order,
  }));
}

export async function listTemplates(): Promise<Template[]> {
  const rows = await sql<TemplateRow>("select * from shift_templates order by sort_order, name");
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    startTime: r.start_time,
    endTime: r.end_time,
    sortOrder: r.sort_order,
  }));
}

export async function listAssignments(weekStart: string): Promise<Assignment[]> {
  const rows = await sql<AssignmentRow>(
    "select * from assignments where week_start = $1::date",
    [weekStart],
  );
  return rows.map((r) => ({
    id: r.id,
    weekStart: asDate(r.week_start) ?? weekStart,
    dayOfWeek: Number(r.day_of_week),
    templateId: r.template_id,
    watcherId: r.watcher_id,
  }));
}

export async function listAssignmentsForWatcher(
  watcherId: string,
  weekStarts: string[],
): Promise<Assignment[]> {
  if (weekStarts.length === 0) return [];
  const placeholders = weekStarts.map((_, i) => `$${i + 2}::date`).join(", ");
  const rows = await sql<AssignmentRow>(
    `select * from assignments
     where watcher_id = $1 and week_start in (${placeholders})
     order by week_start, day_of_week`,
    [watcherId, ...weekStarts],
  );
  return rows.map((r) => ({
    id: r.id,
    weekStart: asDate(r.week_start) ?? String(r.week_start),
    dayOfWeek: Number(r.day_of_week),
    templateId: r.template_id,
    watcherId: r.watcher_id,
  }));
}

export async function listMembers(): Promise<Member[]> {
  const rows = await sql<UserRow>("select * from users order by created_at");
  return rows.map(memberFrom);
}

export async function listInvites(): Promise<Invite[]> {
  const rows = await sql<InviteRow>(
    "select id, token, watcher_id, used_at, created_at, expires_at from invites order by created_at desc",
  );
  return rows.map((r) => ({
    id: r.id,
    token: r.token,
    watcherId: r.watcher_id,
    usedAt: asIso(r.used_at),
    createdAt: asIso(r.created_at) ?? "",
    expiresAt: asIso(r.expires_at),
  }));
}

export async function addWatcher(name: string): Promise<Watcher> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("name-required");
  const existing = await listWatchers();
  const color = WATCHER_COLORS[existing.length % WATCHER_COLORS.length];
  const id = crypto.randomUUID();
  const rows = await sql<WatcherRow>(
    `insert into watchers (id, name, color, sort_order) values ($1, $2, $3, $4) returning *`,
    [id, trimmed, color, existing.length],
  );
  const r = rows[0];
  return { id: r.id, name: r.name, color: r.color, sortOrder: r.sort_order };
}

export async function renameWatcher(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("name-required");
  await sql("update watchers set name = $2 where id = $1", [id, trimmed]);
}

export async function removeWatcher(id: string): Promise<void> {
  await sql("delete from watchers where id = $1", [id]);
}

export async function updateTemplate(
  id: string,
  fields: { name?: string; startTime?: string; endTime?: string },
): Promise<void> {
  if (fields.name != null) {
    await sql("update shift_templates set name = $2 where id = $1", [id, fields.name.trim()]);
  }
  if (fields.startTime != null) {
    await sql("update shift_templates set start_time = $2 where id = $1", [id, fields.startTime]);
  }
  if (fields.endTime != null) {
    await sql("update shift_templates set end_time = $2 where id = $1", [id, fields.endTime]);
  }
}

export async function addTemplate(name: string, startTime: string, endTime: string): Promise<Template> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("name-required");
  const existing = await listTemplates();
  const id = crypto.randomUUID();
  const rows = await sql<TemplateRow>(
    `insert into shift_templates (id, name, start_time, end_time, sort_order)
     values ($1, $2, $3, $4, $5) returning *`,
    [id, trimmed, startTime, endTime, existing.length],
  );
  const r = rows[0];
  return {
    id: r.id,
    name: r.name,
    startTime: r.start_time,
    endTime: r.end_time,
    sortOrder: r.sort_order,
  };
}

export async function removeTemplate(id: string): Promise<void> {
  await sql("delete from shift_templates where id = $1", [id]);
}

export async function assignSlot(
  weekStart: string,
  dayOfWeek: number,
  templateId: string,
  watcherId: string | null,
): Promise<void> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart) || dayOfWeek < 0 || dayOfWeek > 6) {
    throw new Error("invalid");
  }
  if (watcherId == null) {
    await sql(
      "delete from assignments where week_start = $1::date and day_of_week = $2 and template_id = $3",
      [weekStart, dayOfWeek, templateId],
    );
    return;
  }
  await sql(
    `insert into assignments (id, week_start, day_of_week, template_id, watcher_id)
     values ($1, $2::date, $3, $4, $5)
     on conflict (week_start, day_of_week, template_id)
     do update set watcher_id = excluded.watcher_id`,
    [crypto.randomUUID(), weekStart, dayOfWeek, templateId, watcherId],
  );
}

export async function claimWatcher(userId: string, watcherId: string | null): Promise<void> {
  if (watcherId == null) {
    await sql("update users set watcher_id = null where id = $1", [userId]);
    return;
  }
  const rows = await sql<{ id: string }>(
    `update users set watcher_id = $2
     where id = $1
       and not exists (
         select 1 from users other
         where other.watcher_id = $2 and other.id <> $1
       )
     returning id`,
    [userId, watcherId],
  );
  if (!rows[0]) throw new Error("taken");
}

export async function createInvite(createdBy: string, watcherId: string | null): Promise<Invite> {
  const id = crypto.randomUUID();
  const token = randomBytes(24).toString("base64url");
  const rows = await sql<InviteRow>(
    `insert into invites (id, token, created_by, watcher_id, expires_at)
     values ($1, $2, $3, $4, now() + ($5::int * interval '1 day'))
     returning id, token, watcher_id, used_at, created_at, expires_at`,
    [id, token, createdBy, watcherId, 7],
  );
  const r = rows[0];
  return {
    id: r.id,
    token: r.token,
    watcherId: r.watcher_id,
    usedAt: asIso(r.used_at),
    createdAt: asIso(r.created_at) ?? "",
    expiresAt: asIso(r.expires_at),
  };
}

export async function getInviteByToken(token: string): Promise<
  | (Invite & { usedBy: string | null })
  | null
> {
  const rows = await sql<InviteRow & { used_by: string | null }>(
    "select id, token, watcher_id, used_at, created_at, expires_at, used_by from invites where token = $1",
    [token],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    token: r.token,
    watcherId: r.watcher_id,
    usedAt: asIso(r.used_at),
    createdAt: asIso(r.created_at) ?? "",
    expiresAt: asIso(r.expires_at),
    usedBy: r.used_by,
  };
}

export async function consumeInvite(token: string, member: {
  googleSub: string;
  email: string;
  name: string;
}): Promise<{ ok: true; user: Member } | { ok: false; reason: string }> {
  const claimed = await sql<InviteRow & { used_by: string | null }>(
    `update invites
     set used_at = now()
     where token = $1
       and used_at is null
       and expires_at is not null
       and expires_at > now()
     returning id, token, watcher_id, used_at, created_at, expires_at, used_by`,
    [token],
  );
  if (!claimed[0]) {
    const invite = await getInviteByToken(token);
    if (!invite) return { ok: false, reason: "invalid" };
    if (invite.usedAt) return { ok: false, reason: "used" };
    return { ok: false, reason: "expired" };
  }
  const invite = claimed[0];
  let user = await getUserByGoogleSub(member.googleSub);
  if (!user) {
    user = await createUser({
      googleSub: member.googleSub,
      email: member.email,
      name: member.name,
      isAdmin: false,
      watcherId: invite.watcher_id,
    });
  }
  await sql("update invites set used_by = $2 where id = $1", [invite.id, user.id]);
  if (invite.watcher_id && !user.watcherId) {
    try {
      await claimWatcher(user.id, invite.watcher_id);
    } catch {
      /* watcher already linked to someone else */
    }
    user = (await getUserById(user.id)) ?? user;
  }
  return { ok: true, user };
}

export async function revokeInvite(id: string): Promise<void> {
  await sql("delete from invites where id = $1 and used_at is null", [id]);
}
