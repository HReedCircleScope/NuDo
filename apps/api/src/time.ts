import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfWeek } from 'date-fns';

const ZONE = 'America/Phoenix';

/**
 * Returns YYYY-MM-DD for the start of the week in America/Phoenix,
 * converted to UTC (so it’s stable for DB keys).
 * weekStartsOn: 1 = Monday (use 0 for Sunday if you prefer).
 */
export function phoenixWeekStartISODate(d: Date = new Date(), weekStartsOn: 0 | 1 = 1): string {
  const azNow = toZonedTime(d, ZONE);
  const azWeekStart = startOfWeek(azNow, { weekStartsOn });
  const utcDate = fromZonedTime(azWeekStart, ZONE);
  return utcDate.toISOString().slice(0, 10); // YYYY-MM-DD
}