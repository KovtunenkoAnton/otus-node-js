import type { Entry, EntryInput, EntryUpdate } from '../domain/entry.js';
import type { EntryCriteria, EntryListQuery, EntryListResult } from '../domain/entry-list.js';
import { NotFoundError } from '../http/errors.js';
import type { EntriesRepository } from '../repositories/entries.repository.js';

export class EntriesService {
  constructor(private readonly entries: EntriesRepository) {}

  create(input: EntryInput): Promise<Entry> {
    return this.entries.create(input);
  }

  list(query: EntryListQuery): Promise<EntryListResult> {
    return this.entries.list(this.toCriteria(query), query.page, query.limit, query.sort);
  }

  async getById(id: string): Promise<Entry> {
    const entry = await this.entries.findById(id);
    if (!entry) throw new NotFoundError('Entry not found');
    return entry;
  }

  async update(id: string, patch: EntryUpdate): Promise<Entry> {
    const entry = await this.entries.update(id, patch);
    if (!entry) throw new NotFoundError('Entry not found');
    return entry;
  }

  async remove(id: string): Promise<void> {
    const entry = await this.entries.softDelete(id);
    if (!entry) throw new NotFoundError('Entry not found');
  }

  private toCriteria(query: EntryListQuery): EntryCriteria {
    const criteria: EntryCriteria = {};
    if (query.tag) criteria.tags = query.tag;
    if (query.mood) criteria.mood = query.mood;
    if (query.from || query.to) {
      criteria.createdAt = {};
      if (query.from) criteria.createdAt.$gte = query.from;
      if (query.to) criteria.createdAt.$lte = query.to;
    }
    if (query.q) {
      const rx = new RegExp(query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      criteria.$or = [{ title: rx }, { notes: rx }, { content: rx }];
    }
    return criteria;
  }
}
