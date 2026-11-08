"use client";

import { useMemo, useState } from "react";
import { Chrome } from "./Chrome";
import { useAppState } from "./useAppState";
import { DAY_NAMES, formatDayDate, formatWeekRange, isToday, shiftWeek } from "@/lib/week";

export function WeeklyBoard({ initialWeek }: { initialWeek: string }) {
  const [week, setWeek] = useState(initialWeek);
  const { state, error, loading, mutate } = useAppState(week);
  const [open, setOpen] = useState<string | null>(null);

  const assignedCount = state?.assignments.length ?? 0;
  const totalSlots = (state?.templates.length ?? 0) * 7;

  const byKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of state?.assignments ?? []) {
      map.set(`${a.dayOfWeek}:${a.templateId}`, a.watcherId);
    }
    return map;
  }, [state]);

  if (loading || !state) {
    return (
      <div className="app">
        <p>טוען…</p>
      </div>
    );
  }

  const assign = (dayOfWeek: number, templateId: string, watcherId: string | null) => {
    setOpen(null);
    void mutate({
      type: "assignSlot",
      weekStart: week,
      dayOfWeek,
      templateId,
      watcherId,
    });
  };

  return (
    <Chrome me={state.me} authMode={state.authMode} banner={error ?? undefined}>
      <section className="card board-card">
        <div className="week-head">
          <button className="ghost" type="button" onClick={() => setWeek(shiftWeek(week, -1))}>
            שבוע קודם
          </button>
          <div>
            <h2>השבוע</h2>
            <p>{formatWeekRange(week)}</p>
            <p>
              {assignedCount} מתוך {totalSlots} משבצות משובצות. משבצת ריקה נשארת גלויה כפנוי.
            </p>
          </div>
          <div className="week-nav">
            <button className="ghost" type="button" onClick={() => setWeek(state.weekStart)}>
              השבוע הנוכחי
            </button>
            <button className="ghost" type="button" onClick={() => setWeek(shiftWeek(week, 1))}>
              שבוע הבא
            </button>
          </div>
        </div>

        <div className="board-desktop" style={{ ["--slots" as string]: String(state.templates.length) }}>
          <div className="board-head">יום</div>
          {state.templates.map((t) => (
            <div className="board-head" key={t.id}>
              <strong>{t.name}</strong>
              <span className="hours">
                {t.startTime}–{t.endTime}
              </span>
            </div>
          ))}
          {DAY_NAMES.map((day, dayOfWeek) => (
            <DayRow
              key={day}
              day={day}
              dayOfWeek={dayOfWeek}
              week={week}
              today={isToday(week, dayOfWeek)}
              templates={state.templates}
              watchers={state.watchers}
              byKey={byKey}
              open={open}
              setOpen={setOpen}
              onAssign={(templateId, watcherId) => assign(dayOfWeek, templateId, watcherId)}
            />
          ))}
        </div>

        <div className="board-mobile">
          {DAY_NAMES.map((day, dayOfWeek) => (
            <article className={`day-card${isToday(week, dayOfWeek) ? " is-today" : ""}`} key={day}>
              <header className="day-card-head">
                <strong>{day}</strong>
                <span>{formatDayDate(week, dayOfWeek)}</span>
                {isToday(week, dayOfWeek) ? <span className="today-chip">היום</span> : null}
              </header>
              {state.templates.map((t) => {
                const key = `${dayOfWeek}:${t.id}`;
                return (
                  <div className="slot-row" key={t.id}>
                    <div className="slot-meta">
                      <strong>{t.name}</strong>
                      <span className="hours">
                        {t.startTime}–{t.endTime}
                      </span>
                    </div>
                    <SlotPicker
                      slotKey={key}
                      watcherId={byKey.get(key) ?? null}
                      watchers={state.watchers}
                      open={open}
                      setOpen={setOpen}
                      onAssign={(watcherId) => assign(dayOfWeek, t.id, watcherId)}
                    />
                  </div>
                );
              })}
            </article>
          ))}
        </div>
      </section>
    </Chrome>
  );
}

function DayRow({
  day,
  dayOfWeek,
  week,
  today,
  templates,
  watchers,
  byKey,
  open,
  setOpen,
  onAssign,
}: {
  day: string;
  dayOfWeek: number;
  week: string;
  today: boolean;
  templates: { id: string; name: string }[];
  watchers: { id: string; name: string; color: string }[];
  byKey: Map<string, string>;
  open: string | null;
  setOpen: (id: string | null) => void;
  onAssign: (templateId: string, watcherId: string | null) => void;
}) {
  return (
    <>
      <div className="day-label">
        <strong>{day}</strong>
        <span>{formatDayDate(week, dayOfWeek)}</span>
        {today ? <div className="today-chip">היום</div> : null}
      </div>
      {templates.map((t) => {
        const key = `${dayOfWeek}:${t.id}`;
        return (
          <SlotPicker
            key={t.id}
            slotKey={key}
            watcherId={byKey.get(key) ?? null}
            watchers={watchers}
            open={open}
            setOpen={setOpen}
            onAssign={(watcherId) => onAssign(t.id, watcherId)}
          />
        );
      })}
    </>
  );
}

function SlotPicker({
  slotKey,
  watcherId,
  watchers,
  open,
  setOpen,
  onAssign,
}: {
  slotKey: string;
  watcherId: string | null;
  watchers: { id: string; name: string; color: string }[];
  open: string | null;
  setOpen: (id: string | null) => void;
  onAssign: (watcherId: string | null) => void;
}) {
  const watcher = watchers.find((w) => w.id === watcherId);
  return (
    <div className="picker">
      <button
        type="button"
        className={watcher ? "slot filled" : "slot-empty"}
        style={
          watcher
            ? {
                background: `${watcher.color}22`,
                borderColor: watcher.color,
              }
            : undefined
        }
        onClick={() => setOpen(open === slotKey ? null : slotKey)}
      >
        {watcher ? watcher.name : "פנוי"}
      </button>
      {open === slotKey ? (
        <div className="picker-menu">
          <button type="button" onClick={() => onAssign(null)}>
            פנוי
          </button>
          {watchers.map((w) => (
            <button key={w.id} type="button" onClick={() => onAssign(w.id)}>
              {w.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
