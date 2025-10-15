// NuDo shared constants & types (used by API and Mobile)

export const TIMEZONE = "America/Phoenix";
export const WEEKLY_GOAL_HOURS = 6;
export const WEEKLY_CAP_MIN = 18 * 60; // 18h in minutes

// UA 2025 academic windows used for Trophy Road accrual
export const UA_2025_WINDOWS = [
  ["2025-01-15", "2025-05-16"],
  ["2025-08-25", "2025-12-10"],
] as const;

export type Role = "pledge" | "member" | "admin";

export interface Zone {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  isActive: boolean;
}

export interface Session {
  id?: string;
  userId: string;
  zoneId: string;
  startAt: string;   // ISO string
  endAt?: string;    // ISO string
  durationMin?: number;
  source: "manual";
}

// --- Scoring helpers (same rules we agreed on) ---

/** Base points: 1 per 5 minutes, capped at 18h/week */
export function weeklyBasePoints(weeklyMinutes: number) {
  const capped = Math.min(weeklyMinutes, WEEKLY_CAP_MIN);
  return Math.floor(capped / 5);
}

/** Adds weekly bonuses and streak multiplier (max 1.25x) */
export function weeklyTotalPoints(weeklyMinutes: number, streakWeeks: number) {
  let points = weeklyBasePoints(weeklyMinutes);
  const hours = weeklyMinutes / 60;
  if (hours >= 6) points += 25;
  if (hours >= 8) points += 15;
  if (hours >= 10) points += 20;
  if (hours >= 12) points += 25;
  const multiplier = Math.min(1 + 0.05 * streakWeeks, 1.25);
  return Math.floor(points * multiplier);
}