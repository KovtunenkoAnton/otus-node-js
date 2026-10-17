import type { Entry, Mood } from './entry.js';

export const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'title', 'mood'] as const;

export type SortableField = (typeof SORTABLE_FIELDS)[number];

export interface SortSpec {
  field: SortableField;
  dir: 1 | -1;
}

export interface EntryListQuery {
  tag?: string | undefined;
  from?: Date | undefined;
  to?: Date | undefined;
  mood?: Mood | undefined;
  q?: string | undefined;
  page: number;
  limit: number;
  sort: SortSpec;
}

export interface EntryCriteria {
  tags?: string;
  mood?: Mood;
  createdAt?: { $gte?: Date; $lte?: Date };
  $or?: { title?: RegExp; notes?: RegExp; content?: RegExp }[];
}

export interface EntryListResult {
  items: Entry[];
  page: number;
  limit: number;
  total: number;
}
