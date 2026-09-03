/**
 * Formats a date-only value (e.g. a Postgres `date` column, serialized as
 * "YYYY-MM-DD"). Rendered with timeZone: "UTC" because a date-only ISO
 * string parses to UTC midnight — without pinning the zone, a viewer west of
 * UTC would see the calendar date shifted back by one day.
 */
export function formatDate(value: string | null, style: "short" | "long" = "short"): string {
  if (!value) return "No expiration";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: style,
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Formats a timestamp (has a real time-of-day) in the viewer's local time. */
export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** Formats a timestamp as "2 hours ago", "3 days ago", etc. */
export function formatRelativeTime(value: string): string {
  const seconds = Math.round((Date.parse(value) - Date.now()) / 1000);
  const absSeconds = Math.abs(seconds);

  if (absSeconds < 60) return "just now";

  for (const [unit, unitSeconds] of RELATIVE_UNITS) {
    if (absSeconds >= unitSeconds) {
      return relativeFormatter.format(Math.round(seconds / unitSeconds), unit);
    }
  }
  return relativeFormatter.format(Math.round(seconds / 60), "minute");
}
