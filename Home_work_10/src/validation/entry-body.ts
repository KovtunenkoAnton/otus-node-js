import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';
import { MOODS } from '../domain/entry.js';

const sanitizeMarkdown = (value: string): string =>
  sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });

export const entryBodySchema = z.object({
  title: z.string().min(1).max(120),
  mood: z.enum(MOODS).optional(),
  tags: z.array(z.string().min(1)).optional(),
  notes: z.string().max(280).optional(),
  content: z.string().min(1).transform(sanitizeMarkdown),
  links: z.array(z.object({ label: z.string().min(1), url: z.url() })).optional(),
});

export const entryUpdateSchema = entryBodySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });
