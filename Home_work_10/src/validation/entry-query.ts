import { z } from 'zod';
import { MOODS } from '../domain/entry.js';
import { SORTABLE_FIELDS, type SortSpec, type SortableField } from '../domain/entry-list.js';

const sortSchema = z
  .string()
  .regex(
    new RegExp(`^-?(${SORTABLE_FIELDS.join('|')})$`),
    `Invalid sort: use one of ${SORTABLE_FIELDS.join(', ')} (prefix - for desc)`,
  )
  .default('-createdAt')
  .transform((value): SortSpec => ({
    field: value.replace(/^-/, '') as SortableField,
    dir: value.startsWith('-') ? -1 : 1,
  }));

export const entryListQuerySchema = z.object({
  tag: z.string().min(1).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  mood: z.enum(MOODS).optional(),
  q: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: sortSchema,
});
