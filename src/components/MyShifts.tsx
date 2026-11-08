"use client";

import { useMemo, useState } from "react";
import { Chrome } from "./Chrome";
import { useAppState } from "./useAppState";
import { DAY_NAMES, formatDayDate, formatWeekRange, shiftWeek } from "@/lib/week";
import type { Assignment } from "@/lib/types";

export function MyShifts({ initialWeek }: { initialWeek: string }) {
  const [week, setWeek] = useState(initialWeek);
  const weeks = [week, shiftWeek(week, 1), shiftWeek(week, 2)];
  const current = useAppState(weeks[0]);
  const next = useAppState(weeks[1]);
  const after = useAppState(weeks[2]);
  const state = current.state;
  const error = current.error || next.error || after.error;

  const mine = useMemo(() => {
    if (!state?.me.watcherId) return [];
    const all: { weekStart: string; assignment: Assignment }[] = [];
    for (const bundle of [current.state, next.state, after.state]) {
      if (!bundle) continue;
      for (const a of bundle.assignments) {
        if (a.watcherId !== state.me.watcherId) continue;
        const template = bundle.templates.find((item) => item.id === a.templateId);
        if (template && !template.days.includes(a.dayOfWeek)) continue;
        all.push({ weekStart: bundle.weekStart, assignment: a });
      }
    }
    return all.sort(
      (a, b) =>
        a.weekStart.localeCompare(b.weekStart) ||
        a.assignment.dayOfWeek - b.assignment.dayOfWeek,
    );
  }, [state, current.state, next.state, after.state]);

  if (!state) {
    return (
      <div className="app">
        <p>טוען…</p>
      </div>
    );
  }

  const linked = state.watchers.find((w) => w.id === state.me.watcherId);

  return (
    <Chrome me={state.me} authMode={state.authMode} banner={error ?? undefined}>
      <section className="card">
        <div className="week-head">
          <div className="week-nav">
            <button className="ghost" type="button" onClick={() => setWeek(shiftWeek(week, 1))}>
              שבוע הבא
            </button>
          </div>
          <div>
            <h2>המשמרות שלי</h2>
            <p>
              {formatWeekRange(week)} וגם השבועיים שאחריו
            </p>
          </div>
          <button className="ghost" type="button" onClick={() => setWeek(shiftWeek(week, -1))}>
            שבוע קודם
          </button>
        </div>
        {!linked ? (
          <p className="hint">בחרו «זה אני» במסך הניהול כדי לקשר את עצמכם לתורן ולראות את המשמרות שלכם.</p>
        ) : mine.length === 0 ? (
          <p className="hint">אין משמרות משובצות ל{linked.name} בשבועות האלה.</p>
        ) : (
          mine.map(({ weekStart, assignment }) => {
            const template = state.templates.find((t) => t.id === assignment.templateId);
            return (
              <div className="shift-item" key={assignment.id}>
                <div>
                  <strong>{DAY_NAMES[assignment.dayOfWeek]}</strong>
                  <div className="hint" style={{ margin: 0 }}>
                    {formatDayDate(weekStart, assignment.dayOfWeek)}
                  </div>
                </div>
                <div>
                  {template?.name}{" "}
                  <span className="hours">
                    {template?.startTime}–{template?.endTime}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </section>
    </Chrome>
  );
}
