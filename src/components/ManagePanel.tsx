"use client";

import { useState } from "react";
import { Chrome } from "./Chrome";
import { useAppState } from "./useAppState";
import { DAY_SHORT, formatDays } from "@/lib/week";

export function ManagePanel() {
  const { state, error, mutate } = useAppState(null);
  const [watcherName, setWatcherName] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateStart, setTemplateStart] = useState("07:00");
  const [templateEnd, setTemplateEnd] = useState("15:00");
  const [templateDays, setTemplateDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [inviteWatcher, setInviteWatcher] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [rename, setRename] = useState<Record<string, string>>({});

  if (!state) {
    return (
      <div className="app">
        <p>טוען…</p>
      </div>
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <Chrome me={state.me} authMode={state.authMode} banner={error ?? undefined}>
      <div className="stack">
        <section className="card">
          <h2 className="section-title">תורנים</h2>
          <p className="hint">
            בני המשפחה המשגיחים בבית. כל אחד יכול ללחוץ «זה אני» כדי לראות את המשמרות שלו.
          </p>
          {state.me.isAdmin ? (
            <div className="row">
              <input
                className="grow"
                placeholder="שם התורן"
                value={watcherName}
                onChange={(e) => setWatcherName(e.target.value)}
              />
              <button
                className="primary"
                type="button"
                onClick={() => {
                  void mutate({ type: "addWatcher", name: watcherName }).then(() =>
                    setWatcherName(""),
                  );
                }}
              >
                הוספה
              </button>
            </div>
          ) : null}
          {state.watchers.map((w) => (
            <div className="row" key={w.id}>
              <span className="dot" style={{ background: w.color }} />
              {state.me.isAdmin ? (
                <input
                  className="grow"
                  value={rename[w.id] ?? w.name}
                  onChange={(e) => setRename((r) => ({ ...r, [w.id]: e.target.value }))}
                  onBlur={() => {
                    const name = (rename[w.id] ?? w.name).trim();
                    if (name && name !== w.name) void mutate({ type: "renameWatcher", id: w.id, name });
                  }}
                />
              ) : (
                <strong className="grow">{w.name}</strong>
              )}
              {state.me.watcherId === w.id ? <span className="badge">אני</span> : null}
              <button
                className="ghost"
                type="button"
                onClick={() =>
                  void mutate({
                    type: "claimWatcher",
                    watcherId: state.me.watcherId === w.id ? null : w.id,
                  })
                }
              >
                {state.me.watcherId === w.id ? "בטל שיוך" : "זה אני"}
              </button>
              {state.me.isAdmin ? (
                <button
                  className="danger"
                  type="button"
                  onClick={() => void mutate({ type: "removeWatcher", id: w.id })}
                >
                  מחיקה
                </button>
              ) : null}
            </div>
          ))}
        </section>

        <section className="card">
          <h2 className="section-title">תבניות משמרות</h2>
          <p className="hint">
            בחרו באילו ימים כל משמרת מופיעה. ברירת המחדל: בוקר, צהריים ולילה בימים א׳–ה׳, ומשמרת יממה בשישי ושבת.
          </p>
          {state.templates.map((t) => (
            <div className="template-block" key={t.id}>
              <div className="row">
                {state.me.isAdmin ? (
                  <>
                    <input
                      value={rename[t.id] ?? t.name}
                      onChange={(e) => setRename((r) => ({ ...r, [t.id]: e.target.value }))}
                      onBlur={() => {
                        const name = (rename[t.id] ?? t.name).trim();
                        if (name && name !== t.name) {
                          void mutate({ type: "updateTemplate", id: t.id, name });
                        }
                      }}
                    />
                    <input
                      className="hours"
                      defaultValue={t.startTime}
                      onBlur={(e) =>
                        void mutate({ type: "updateTemplate", id: t.id, startTime: e.target.value })
                      }
                    />
                    <input
                      className="hours"
                      defaultValue={t.endTime}
                      onBlur={(e) =>
                        void mutate({ type: "updateTemplate", id: t.id, endTime: e.target.value })
                      }
                    />
                    <button
                      className="danger"
                      type="button"
                      onClick={() => void mutate({ type: "removeTemplate", id: t.id })}
                    >
                      מחיקה
                    </button>
                  </>
                ) : (
                  <>
                    <strong className="grow">{t.name}</strong>
                    <span className="hours">
                      {t.startTime}–{t.endTime}
                    </span>
                    <span className="hint" style={{ margin: 0 }}>
                      {formatDays(t.days)}
                    </span>
                  </>
                )}
              </div>
              {state.me.isAdmin ? (
                <DayChips
                  days={t.days}
                  onToggle={(day) => {
                    const next = t.days.includes(day)
                      ? t.days.filter((item) => item !== day)
                      : [...t.days, day].sort((a, b) => a - b);
                    if (next.length === 0) return;
                    void mutate({ type: "updateTemplate", id: t.id, days: next });
                  }}
                />
              ) : null}
            </div>
          ))}
          {state.me.isAdmin ? (
            <div className="template-block">
              <div className="row">
                <input
                  placeholder="שם משמרת חדשה"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
                <input
                  className="hours"
                  value={templateStart}
                  onChange={(e) => setTemplateStart(e.target.value)}
                />
                <input
                  className="hours"
                  value={templateEnd}
                  onChange={(e) => setTemplateEnd(e.target.value)}
                />
                <button
                  className="primary"
                  type="button"
                  onClick={() => {
                    void mutate({
                      type: "addTemplate",
                      name: templateName,
                      startTime: templateStart,
                      endTime: templateEnd,
                      days: templateDays,
                    }).then(() => setTemplateName(""));
                  }}
                >
                  הוספת משמרת
                </button>
              </div>
              <DayChips
                days={templateDays}
                onToggle={(day) =>
                  setTemplateDays((current) => {
                    const next = current.includes(day)
                      ? current.filter((item) => item !== day)
                      : [...current, day].sort((a, b) => a - b);
                    return next.length === 0 ? current : next;
                  })
                }
              />
            </div>
          ) : null}
        </section>

        {state.me.isAdmin ? (
          <section className="card">
            <h2 className="section-title">הזמנות לבני משפחה</h2>
            <p className="hint">
              יצירת קישור, העתקה, ושליחה ב-WhatsApp או בהודעה. מי שפותח את הקישור נכנס עם Google ומצטרף.
            </p>
            <div className="row">
              <select
                className="grow"
                value={inviteWatcher}
                onChange={(e) => setInviteWatcher(e.target.value)}
              >
                <option value="">בלי שיוך לתורן</option>
                {state.watchers.map((w) => (
                  <option key={w.id} value={w.id}>
                    שייך אל {w.name}
                  </option>
                ))}
              </select>
              <button
                className="primary"
                type="button"
                data-testid="create-invite"
                onClick={async () => {
                  const data = (await mutate({
                    type: "createInvite",
                    watcherId: inviteWatcher || null,
                  })) as { invite?: { token: string } } | null;
                  const token = data?.invite?.token;
                  if (token) setCopied(`${origin}/invite/${token}`);
                }}
              >
                יצירת קישור הזמנה
              </button>
            </div>
            {copied ? (
              <div className="copy-box">
                <input
                  data-testid="invite-url"
                  readOnly
                  value={copied}
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  className="ghost"
                  type="button"
                  onClick={() => {
                    const input = document.querySelector<HTMLInputElement>("[data-testid=invite-url]");
                    input?.select();
                    void navigator.clipboard?.writeText(copied).catch(() => undefined);
                  }}
                >
                  העתקה
                </button>
                {typeof navigator !== "undefined" && "share" in navigator ? (
                  <button
                    className="primary"
                    type="button"
                    onClick={() =>
                      void navigator.share({ title: "הזמנה לשבצתי", url: copied, text: copied })
                    }
                  >
                    שיתוף
                  </button>
                ) : null}
              </div>
            ) : null}
            {state.invites.map((inv) => {
              const url = `${origin}/invite/${inv.token}`;
              const watcher = state.watchers.find((w) => w.id === inv.watcherId);
              return (
                <div className="row" key={inv.id}>
                  <div className="grow">
                    <div>{inv.usedAt ? "נוצל" : "ממתין"}{watcher ? ` · ${watcher.name}` : ""}</div>
                    <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
                  </div>
                  {!inv.usedAt ? (
                    <>
                      <button
                        className="ghost"
                        type="button"
                        onClick={() => {
                          void navigator.clipboard?.writeText(url).catch(() => undefined);
                          setCopied(url);
                        }}
                      >
                        העתקה
                      </button>
                      <button
                        className="danger"
                        type="button"
                        onClick={() => void mutate({ type: "revokeInvite", id: inv.id })}
                      >
                        ביטול
                      </button>
                    </>
                  ) : null}
                </div>
              );
            })}
          </section>
        ) : null}

        {state.me.isAdmin ? (
          <section className="card">
            <h2 className="section-title">מנהלים ובני משפחה</h2>
            <p className="hint">
              אפשר שיהיו כמה מנהלים. הזמינו בן משפחה, ואחרי שהוא מצטרף לחצו «הפוך למנהל». אפשר גם להוסיף כתובת ל-ADMIN_EMAIL ב-Cursor.
            </p>
            {state.members.map((member) => (
              <div className="row" key={member.id}>
                <div className="grow">
                  <strong>{member.name || member.email}</strong>
                  {member.email ? <div className="hint">{member.email}</div> : null}
                </div>
                {member.isAdmin ? <span className="badge">מנהל</span> : null}
                {member.id === state.me.id ? (
                  <span className="hint">אני</span>
                ) : (
                  <button
                    className={member.isAdmin ? "ghost" : "primary"}
                    type="button"
                    onClick={() =>
                      void mutate({
                        type: "setMemberAdmin",
                        userId: member.id,
                        isAdmin: !member.isAdmin,
                      })
                    }
                  >
                    {member.isAdmin ? "הסר הרשאת מנהל" : "הפוך למנהל"}
                  </button>
                )}
              </div>
            ))}
          </section>
        ) : null}

      </div>
    </Chrome>
  );
}

function DayChips({
  days,
  onToggle,
}: {
  days: number[];
  onToggle: (day: number) => void;
}) {
  return (
    <div className="day-chips" role="group" aria-label="ימי המשמרת">
      {DAY_SHORT.map((label, day) => {
        const on = days.includes(day);
        return (
          <button
            key={label}
            type="button"
            className={on ? "day-chip on" : "day-chip"}
            aria-pressed={on}
            onClick={() => onToggle(day)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
