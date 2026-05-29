export const APP_TIME_ZONE = process.env.APP_TIME_ZONE || "Asia/Kolkata";

export function getDateKey(date = new Date(), timeZone = APP_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return date.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

export function getLastDateKeys(days: number, endDateKey = getDateKey()) {
  const endDate = new Date(`${endDateKey}T00:00:00.000Z`);

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(endDate);
    date.setUTCDate(endDate.getUTCDate() - (days - index - 1));
    return date.toISOString().slice(0, 10);
  });
}

export function formatShortWeekday(dateKey: string) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "UTC" }).format(
    new Date(`${dateKey}T00:00:00.000Z`)
  );
}

export function relativeTimeFromNow(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const divisions: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat("en-IN", { numeric: "auto" });

  for (const [unit, amount] of divisions) {
    if (Math.abs(seconds) >= amount || unit === "minute") {
      return formatter.format(Math.round(seconds / amount), unit);
    }
  }

  return "just now";
}
