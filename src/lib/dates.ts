import type { ISODate } from "./types";

/*
 * Date helpers. Everything works on UTC calendar dates so results never
 * shift with the viewer's time zone. Business days are Monday–Friday
 * (public holidays are out of scope for the demo).
 */

const DAY_MS = 86_400_000;

export function toDate(iso: ISODate): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISO(date: Date): ISODate {
  return date.toISOString().slice(0, 10);
}

function isWeekend(date: Date) {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/** Adds `n` business days (negative to go back). Weekend inputs roll forward first. */
export function addBusinessDays(iso: ISODate, n: number): ISODate {
  const date = toDate(iso);
  const step = n >= 0 ? 1 : -1;
  let remaining = Math.abs(n);
  while (remaining > 0) {
    date.setTime(date.getTime() + step * DAY_MS);
    if (!isWeekend(date)) remaining--;
  }
  return toISO(date);
}

/** Business days in (a, b]. Negative when b is before a. */
export function businessDaysBetween(a: ISODate, b: ISODate): number {
  if (a === b) return 0;
  const sign = b > a ? 1 : -1;
  const [from, to] = sign === 1 ? [a, b] : [b, a];
  const date = toDate(from);
  const end = toDate(to);
  let count = 0;
  while (date < end) {
    date.setTime(date.getTime() + DAY_MS);
    if (!isWeekend(date)) count++;
  }
  return sign * count;
}

/** Business days in [start, end], inclusive of both. */
export function businessDaysInclusive(start: ISODate, end: ISODate): number {
  return businessDaysBetween(addBusinessDays(start, -1), end);
}

export function calendarDaysBetween(a: ISODate, b: ISODate): number {
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / DAY_MS);
}

export function maxDate(...dates: (ISODate | undefined)[]): ISODate {
  return dates.filter(Boolean).sort().at(-1)!;
}

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts });

const short = fmt({ month: "short", day: "numeric" });
const withDay = fmt({ weekday: "short", month: "short", day: "numeric" });
const long = fmt({ month: "short", day: "numeric", year: "numeric" });
const full = fmt({ weekday: "long", month: "long", day: "numeric", year: "numeric" });
const monthName = fmt({ month: "long", year: "numeric" });

/** "Oct 7" */
export const formatDate = (iso: ISODate) => short.format(toDate(iso));
/** "Wed, Oct 7" */
export const formatDay = (iso: ISODate) => withDay.format(toDate(iso));
/** "Oct 7, 2026" */
export const formatLong = (iso: ISODate) => long.format(toDate(iso));
/** "Wednesday, October 7, 2026" */
export const formatFull = (iso: ISODate) => full.format(toDate(iso));
/** "October 2026" */
export const formatMonth = (iso: ISODate) => monthName.format(toDate(iso));

/** "2026-10-07T14:20" → "Oct 7 · 2:20 PM" */
export function formatDateTime(isoDateTime: string): string {
  const [datePart, timePart = "00:00"] = isoDateTime.split("T");
  const [h, m] = timePart.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${formatDate(datePart)} · ${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export const plural = (n: number, word: string, pluralWord = `${word}s`) =>
  `${n} ${n === 1 ? word : pluralWord}`;

export const businessDays = (n: number) => plural(n, "business day");
