/**
 * The Body Heartbeat's calendar.
 *
 * "Today" is the house's calendar day in America/New_York — not the
 * UTC day and not whichever timezone a reader's browser happens to
 * use. This is the single derivation shared by the live counter's
 * server-side day buckets and by client code that needs the current
 * heartbeat day, so those surfaces can never roll over at different
 * midnights again.
 */

export const HEARTBEAT_TIME_ZONE = "America/New_York";

const heartbeatDayParts = new Intl.DateTimeFormat("en-US", {
  timeZone: HEARTBEAT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The current Body Heartbeat day as YYYY-MM-DD in America/New_York. */
export function heartbeatToday(now: Date = new Date()): string {
  const parts = heartbeatDayParts.formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;

  return `${value("year")}-${value("month")}-${value("day")}`;
}
