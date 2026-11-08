export const TIMEZONE = "Asia/Jerusalem";

const WEEKDAY_TO_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function zonedYmd(date = new Date(), timeZone = TIMEZONE) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: WEEKDAY_TO_INDEX[parts.weekday] ?? 0,
  };
}

function ymdString(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function addDays(year: number, month: number, day: number, delta: number) {
  const utc = Date.UTC(year, month - 1, day) + delta * 86400000;
  const d = new Date(utc);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

export function weekStartSunday(date = new Date()): string {
  const p = zonedYmd(date);
  const start = addDays(p.year, p.month, p.day, -p.weekday);
  return ymdString(start.year, start.month, start.day);
}

export function shiftWeek(weekStart: string, weeks: number): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  const next = addDays(y, m, d, weeks * 7);
  return ymdString(next.year, next.month, next.day);
}

export function parseWeekStart(value: string | null | undefined): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return weekStartSunday();
}

export const DAY_NAMES = [
  "יום ראשון",
  "יום שני",
  "יום שלישי",
  "יום רביעי",
  "יום חמישי",
  "יום שישי",
  "יום שבת",
];

export const DAY_SHORT = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
export const WEEKDAY_DAYS = [0, 1, 2, 3, 4];
export const WEEKEND_DAYS = [5, 6];

export function normalizeDays(value: unknown): number[] {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "number"
      ? ALL_DAYS.filter((day) => (value & (1 << day)) !== 0)
      : ALL_DAYS;
  const days = [...new Set(raw.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))];
  days.sort((a, b) => a - b);
  return days;
}

export function daysToMask(days: number[]): number {
  const mask = normalizeDays(days).reduce((value, day) => value | (1 << day), 0);
  return mask === 0 ? 127 : mask;
}

export function templatesForDay<T extends { days: number[] }>(templates: T[], dayOfWeek: number): T[] {
  return templates.filter((template) => template.days.includes(dayOfWeek));
}

export function slotCount(templates: { days: number[] }[]): number {
  return templates.reduce((total, template) => total + template.days.length, 0);
}

export function formatDays(days: number[]): string {
  const normalized = normalizeDays(days);
  if (normalized.length === 7) return "כל השבוע";
  if (normalized.join() === WEEKDAY_DAYS.join()) return "א׳–ה׳";
  if (normalized.join() === WEEKEND_DAYS.join()) return "ו׳–ש׳";
  return normalized.map((day) => DAY_SHORT[day]).join(" · ");
}

export function formatDayDate(weekStart: string, dayOfWeek: number): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  const day = addDays(y, m, d, dayOfWeek);
  return `${day.day}.${day.month}`;
}

export function formatWeekRange(weekStart: string): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  const end = addDays(y, m, d, 6);
  const startDate = new Date(Date.UTC(y, m - 1, d, 12));
  const endDate = new Date(Date.UTC(end.year, end.month - 1, end.day, 12));
  const fmt = new Intl.DateTimeFormat("he-IL", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${fmt.format(startDate)} – ${fmt.format(endDate)}`;
}

export function isToday(weekStart: string, dayOfWeek: number): boolean {
  const now = zonedYmd();
  const [y, m, d] = weekStart.split("-").map(Number);
  const day = addDays(y, m, d, dayOfWeek);
  return day.year === now.year && day.month === now.month && day.day === now.day;
}
