import { model, Schema, type InferSchemaType } from 'mongoose';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

export const MOODS = ['good', 'neutral', 'bad'] as const;

const linkSchema = new Schema(
  {
    label: { type: String, required: true },
    url: {
      type: String,
      required: true,
      validate: (value: string) => {
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
    },
  },
  { _id: false },
);

const entrySchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 120 },
    mood: { type: String, enum: MOODS, required: true, default: MOODS[1] },
    tags: { type: [String], default: [] },
    notes: { type: String, maxlength: 280, default: '' },
    content: { type: String, required: true },
    links: { type: [linkSchema], default: [] },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

export type Entry = InferSchemaType<typeof entrySchema>;

export const EntryModel = model<Entry>('Entry', entrySchema);

const sanitizeMarkdown = (value: string) =>
  sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });

export const entryInputSchema = z.object({
  title: z.string().min(1).max(120),
  mood: z.enum(MOODS).optional(),
  tags: z.array(z.string().min(1)).optional(),
  notes: z.string().max(280).optional(),
  content: z.string().min(1).transform(sanitizeMarkdown),
  links: z.array(z.object({ label: z.string().min(1), url: z.url() })).optional(),
});
