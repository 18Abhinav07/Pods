export function formatZonedMoment(
  value: string | Date,
  options: {
    timeZone: string;
    includeYear?: boolean;
    includeZone?: boolean;
  }
) {
  const parts = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(options.includeYear ? { year: "numeric" as const } : {}),
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: options.timeZone
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  const year = options.includeYear ? `, ${part("year")}` : "";
  const zone = options.includeZone ? ` ${options.timeZone}` : "";
  return `${part("month")} ${part("day")}${year} · ${part("hour")}:${part("minute")} ${part("dayPeriod")}${zone}`;
}
