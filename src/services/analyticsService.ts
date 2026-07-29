import { db } from "@/lib/db";

export interface WeeklyAnalyticsPoint {
  weekLabel: string;
  weekStart: string;
  deposits: number;
  withdrawals: number;
  newUsers: number;
}

export interface AnalyticsSummary {
  weekly: WeeklyAnalyticsPoint[];
  totals: { deposits: number; withdrawals: number; netFlow: number; newUsers: number };
}

function startOfWeek(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

function formatWeekLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export class AnalyticsService {
  async getPlatformAnalytics(weeks: number = 8): Promise<AnalyticsSummary> {
    const boundedWeeks = Math.min(Math.max(Math.floor(weeks) || 8, 1), 26);
    const rangeStart = startOfWeek(new Date());
    rangeStart.setUTCDate(rangeStart.getUTCDate() - (boundedWeeks - 1) * 7);

    const [deposits, withdrawals, users] = await Promise.all([
      db.deposit.findMany({
        where: { status: "APPROVED", deletedAt: null, createdAt: { gte: rangeStart } },
        select: { amount: true, createdAt: true },
      }),
      db.withdrawal.findMany({
        where: { status: "APPROVED", deletedAt: null, createdAt: { gte: rangeStart } },
        select: { amount: true, createdAt: true },
      }),
      db.user.findMany({
        where: { deletedAt: null, createdAt: { gte: rangeStart } },
        select: { createdAt: true },
      }),
    ]);

    const buckets = new Map<string, WeeklyAnalyticsPoint>();
    for (let i = 0; i < boundedWeeks; i++) {
      const weekStart = new Date(rangeStart);
      weekStart.setUTCDate(rangeStart.getUTCDate() + i * 7);
      const key = weekStart.toISOString();
      buckets.set(key, { weekLabel: formatWeekLabel(weekStart), weekStart: key, deposits: 0, withdrawals: 0, newUsers: 0 });
    }
    const bucketKeys = Array.from(buckets.keys()).sort();
    const bucketKeyFor = (date: Date) => {
      const key = startOfWeek(date).toISOString();
      return buckets.has(key) ? key : bucketKeys[bucketKeys.length - 1];
    };

    for (const d of deposits) {
      const bucket = buckets.get(bucketKeyFor(new Date(d.createdAt)));
      if (bucket) bucket.deposits += d.amount;
    }
    for (const w of withdrawals) {
      const bucket = buckets.get(bucketKeyFor(new Date(w.createdAt)));
      if (bucket) bucket.withdrawals += w.amount;
    }
    for (const u of users) {
      const bucket = buckets.get(bucketKeyFor(new Date(u.createdAt)));
      if (bucket) bucket.newUsers += 1;
    }

    const weekly = bucketKeys.map((k) => buckets.get(k)!);
    const totals = weekly.reduce(
      (acc, w) => ({
        deposits: acc.deposits + w.deposits,
        withdrawals: acc.withdrawals + w.withdrawals,
        newUsers: acc.newUsers + w.newUsers,
        netFlow: 0,
      }),
      { deposits: 0, withdrawals: 0, newUsers: 0, netFlow: 0 }
    );
    totals.netFlow = totals.deposits - totals.withdrawals;

    return { weekly, totals };
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
