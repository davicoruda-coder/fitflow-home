/** App calendar timezone — FitFlow is PT-BR / Brazil-first. */
export const APP_TIMEZONE = "America/Sao_Paulo";

/** Today's calendar date in the app timezone as `YYYY-MM-DD`. */
export function appDateKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** UTC date-only midnight for the app-local calendar day of `date`. */
export function appCalendarDate(date: Date = new Date()): Date {
  const [y, m, d] = appDateKey(date).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Shift a `YYYY-MM-DD` key by whole calendar days. */
export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return next.toISOString().slice(0, 10);
}
