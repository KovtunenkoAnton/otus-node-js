import { EntryModel, type EntryDoc } from '../db/entry.model.js';
import type { Entry, EntryInput, EntryUpdate } from '../domain/entry.js';
import type { EntryCriteria, EntryListResult, SortSpec } from '../domain/entry-list.js';
import type { DayCount, TagCount } from '../domain/stats.js';

const toEntry = (doc: EntryDoc): Entry => ({
  id: doc._id.toString(),
  title: doc.title,
  mood: doc.mood,
  tags: [...doc.tags],
  notes: doc.notes,
  content: doc.content,
  links: doc.links.map((link) => ({ label: link.label, url: link.url })),
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

type Defined<T> = {
  [K in keyof T as T[K] extends undefined ? never : K]?: Exclude<T[K], undefined>;
};

const withoutUndefined = <T extends object>(value: T): Defined<T> =>
  Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Defined<T>;

export class EntriesRepository {
  async create(input: EntryInput): Promise<Entry> {
    const doc = await EntryModel.create(withoutUndefined(input));
    return toEntry(doc);
  }

  async list(
    criteria: EntryCriteria,
    page: number,
    limit: number,
    sort: SortSpec,
  ): Promise<EntryListResult> {
    const filter = { ...criteria, deletedAt: null };
    const [docs, total] = await Promise.all([
      EntryModel.find(filter)
        .sort({ [sort.field]: sort.dir })
        .skip((page - 1) * limit)
        .limit(limit),
      EntryModel.countDocuments(filter),
    ]);
    return { items: docs.map(toEntry), page, limit, total };
  }

  async findById(id: string): Promise<Entry | null> {
    const doc = await EntryModel.findOne({ _id: id, deletedAt: null });
    return doc ? toEntry(doc) : null;
  }

  async update(id: string, patch: EntryUpdate): Promise<Entry | null> {
    const doc = await EntryModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      withoutUndefined(patch),
      { returnDocument: 'after' },
    );
    return doc ? toEntry(doc) : null;
  }

  async softDelete(id: string): Promise<Entry | null> {
    const doc = await EntryModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() },
      { returnDocument: 'after' },
    );
    return doc ? toEntry(doc) : null;
  }

  async tagCounts(): Promise<TagCount[]> {
    return EntryModel.aggregate<TagCount>([
      { $match: { deletedAt: null } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { tag: '$_id', count: 1, _id: 0 } },
    ]);
  }

  async dayCounts(): Promise<DayCount[]> {
    return EntryModel.aggregate<DayCount>([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]);
  }
}
