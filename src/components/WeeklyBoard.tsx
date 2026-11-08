"use client";

import { useEffect, useMemo, useState } from "react";
import { Chrome } from "./Chrome";
import { useAppState } from "./useAppState";
import {
  DAY_NAMES,
  formatDayDate,
  formatWeekRange,
  isToday,
  shiftWeek,
  slotCount,
  templatesForDay,
} from "@/lib/week";
import { NOTE_MAX_LENGTH, type Template } from "@/lib/types";

export function WeeklyBoard({ initialWeek }: { initialWeek: string }) {
  const [week, setWeek] = useState(initialWeek);
  const { state, error, loading, mutate } = useAppState(week);
  const [open, setOpen] = useState<string | null>(null);

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

  const totalSlots = slotCount(state.templates);
  const assignedCount = state.assignments.filter((assignment) => {
    const template = state.templates.find((item) => item.id === assignment.templateId);
    return Boolean(template?.days.includes(assignment.dayOfWeek));
  }).length;

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

        <div className="board-days">
          {DAY_NAMES.map((day, dayOfWeek) => (
            <DayCard
              key={day}
              day={day}
              dayOfWeek={dayOfWeek}
              week={week}
              today={isToday(week, dayOfWeek)}
              templates={templatesForDay(state.templates, dayOfWeek)}
              watchers={state.watchers}
              note={(state.notes ?? []).find((item) => item.dayOfWeek === dayOfWeek)?.body ?? ""}
              byKey={byKey}
              open={open}
              setOpen={setOpen}
              onAssign={(templateId, watcherId) => assign(dayOfWeek, templateId, watcherId)}
              onSaveNote={(body) => {
                void mutate({ type: "setDayNote", weekStart: week, dayOfWeek, body });
              }}
            />
          ))}
        </div>
      </section>
    </Chrome>
  );
}

function DayCard({
  day,
  dayOfWeek,
  week,
  today,
  templates,
  watchers,
  note,
  byKey,
  open,
  setOpen,
  onAssign,
  onSaveNote,
}: {
  day: string;
  dayOfWeek: number;
  week: string;
  today: boolean;
  templates: Template[];
  watchers: { id: string; name: string; color: string }[];
  note: string;
  byKey: Map<string, string>;
  open: string | null;
  setOpen: (id: string | null) => void;
  onAssign: (templateId: string, watcherId: string | null) => void;
  onSaveNote: (body: string) => void;
}) {
  return (
    <article className={`day-card${today ? " is-today" : ""}`}>
      <header className="day-card-head">
        <strong>{day}</strong>
        <span>{formatDayDate(week, dayOfWeek)}</span>
        {today ? <span className="today-chip">היום</span> : null}
      </header>
      <div className="day-slots">
        {templates.length === 0 ? (
          <p className="hint">אין משמרות ביום הזה</p>
        ) : (
          templates.map((template) => {
            const key = `${dayOfWeek}:${template.id}`;
            return (
              <div className="slot-row" key={template.id}>
                <div className="slot-meta">
                  <strong>{template.name}</strong>
                  <span className="hours">
                    {template.startTime}–{template.endTime}
                  </span>
                </div>
                <SlotPicker
                  slotKey={key}
                  watcherId={byKey.get(key) ?? null}
                  watchers={watchers}
                  open={open}
                  setOpen={setOpen}
                  onAssign={(watcherId) => onAssign(template.id, watcherId)}
                />
              </div>
            );
          })
        )}
      </div>
      <DayNoteField dayOfWeek={dayOfWeek} body={note} onSave={onSaveNote} />
    </article>
  );
}

function DayNoteField({
  dayOfWeek,
  body,
  onSave,
}: {
  dayOfWeek: number;
  body: string;
  onSave: (text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(body);

  useEffect(() => {
    if (!editing) setDraft(body);
  }, [body, editing]);

  if (!editing) {
    return (
      <div className="day-note">
        {body ? <p className="day-note-text">{body}</p> : <p className="day-note-empty">אין הערה ליום הזה</p>}
        <button className="ghost" type="button" onClick={() => setEditing(true)}>
          {body ? "עריכת הערה" : "הוספת הערה"}
        </button>
      </div>
    );
  }

  const remaining = NOTE_MAX_LENGTH - draft.length;
  return (
    <form
      className="day-note is-editing"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft);
        setEditing(false);
      }}
    >
      <label className="day-note-label" htmlFor={`day-note-${dayOfWeek}`}>
        הערה ליום, למשל תור למרפאה או טיפול
      </label>
      <textarea
        id={`day-note-${dayOfWeek}`}
        value={draft}
        maxLength={NOTE_MAX_LENGTH}
        rows={3}
        dir="rtl"
        placeholder="למשל תור למרפאה בשעה 10:00"
        onChange={(event) => setDraft(event.target.value)}
      />
      <div className="day-note-actions">
        <button className="primary" type="submit">
          שמירה
        </button>
        <button
          className="ghost"
          type="button"
          onClick={() => {
            setDraft(body);
            setEditing(false);
          }}
        >
          ביטול
        </button>
        {body ? (
          <button
            className="ghost"
            type="button"
            onClick={() => {
              onSave("");
              setDraft("");
              setEditing(false);
            }}
          >
            מחיקה
          </button>
        ) : null}
        <span className="hint">{remaining}</span>
      </div>
    </form>
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
