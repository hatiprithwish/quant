export type PeriodType = "weekly" | "monthly" | "quarterly" | "yearly";

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseUTC(dateStr: string): Date {
  const [y, m, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

export function computeDateRange(period: PeriodType, startDate: string): { from: string; to: string } {
  const start = parseUTC(startDate);

  let to: Date;
  switch (period) {
    case "weekly":
      to = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6));
      break;
    case "monthly":
      to = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
      break;
    case "quarterly":
      to = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 3, 0));
      break;
    case "yearly":
      to = new Date(Date.UTC(start.getUTCFullYear(), 11, 31));
      break;
  }

  return { from: startDate, to: toISODate(to) };
}

export function computePriorRange(period: PeriodType, from: string, to: string): { from: string; to: string } {
  const fromDate = parseUTC(from);
  const toDate = parseUTC(to);

  let priorFrom: Date;
  let priorTo: Date;

  switch (period) {
    case "weekly":
      priorFrom = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate() - 7));
      priorTo = new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate() - 7));
      break;
    case "monthly":
      priorFrom = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth() - 1, fromDate.getUTCDate()));
      priorTo = new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth() - 1, 0));
      // last day of prior month
      priorTo = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), 0));
      priorFrom = new Date(Date.UTC(priorTo.getUTCFullYear(), priorTo.getUTCMonth(), 1));
      break;
    case "quarterly":
      priorFrom = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth() - 3, fromDate.getUTCDate()));
      priorTo = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), 0));
      break;
    case "yearly":
      priorFrom = new Date(Date.UTC(fromDate.getUTCFullYear() - 1, 0, 1));
      priorTo = new Date(Date.UTC(fromDate.getUTCFullYear() - 1, 11, 31));
      break;
  }

  return { from: toISODate(priorFrom), to: toISODate(priorTo) };
}

export function detectPeriod(from: string, to: string): PeriodType | null {
  const fromDate = parseUTC(from);
  const toDate = parseUTC(to);
  const diffDays = Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000);

  if (diffDays === 6) return "weekly";
  if (diffDays >= 27 && diffDays <= 31) return "monthly";
  if (diffDays >= 88 && diffDays <= 92) return "quarterly";
  if (diffDays >= 364 && diffDays <= 366) return "yearly";
  return null;
}
