import type { Request, Response } from 'express';
import { EntryModel } from '../models/entries';

interface TagCount {
  tag: string;
  count: number;
}

interface DayCount {
  date: string;
  count: number;
}

export const getStats = async (req: Request, res: Response) => {
  const [byTags, byDate] = await Promise.all([
    EntryModel.aggregate([
      { $match: { deletedAt: null } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { tag: '$_id', count: 1, _id: 0 } },
    ]),
    EntryModel.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]),
  ]);

  const tags = byTags as TagCount[];
  const days = byDate as DayCount[];

  const daySet = new Set(days.map((d) => d.date));
  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  let cursor = new Date();
  cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate()));
  
  if (!daySet.has(dayKey(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  let streak = 0;
  while (daySet.has(dayKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  res.json({ byTags: tags, byDate: days, streak });
};
