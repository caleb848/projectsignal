import type { ISODate } from "./types";

/**
 * The "today" the demo data is written against. Every calculated value
 * (days waiting, overdue milestones, schedule impact) is relative to this
 * date, so the scenarios stay coherent no matter when the app is viewed.
 * Move it and the whole portfolio re-calculates.
 */
export const SNAPSHOT_DATE: ISODate = "2026-10-07";

/** Monday of each week shown on the Capacity page. Week 0 is the current week. */
export const CAPACITY_WEEKS: ISODate[] = [
  "2026-10-05",
  "2026-10-12",
  "2026-10-19",
  "2026-10-26",
];

/** A waiting item older than this (business days) counts as overdue. */
export const WAITING_THRESHOLD_DAYS = 3;
