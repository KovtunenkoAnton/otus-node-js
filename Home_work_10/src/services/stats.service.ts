import type { DayCount, Stats } from '../domain/stats.js';
import type { EntriesRepository } from '../repositories/entries.repository.js';

const computeStreak = (days: DayCount[]): number => {
  const daySet = new Set(days.map((day) => day.date));
  const dayKey = (date: Date): string => date.toISOString().slice(0, 10);
  const now = new Date();
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (!daySet.has(dayKey(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  let streak = 0;
  while (daySet.has(dayKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
};

export class StatsService {
  constructor(private readonly entries: EntriesRepository) {}

  async getStats(): Promise<Stats> {
    const [byTags, byDate] = await Promise.all([
      this.entries.tagCounts(),
      this.entries.dayCounts(),
    ]);
    return { byTags, byDate, streak: computeStreak(byDate) };
  }
}
