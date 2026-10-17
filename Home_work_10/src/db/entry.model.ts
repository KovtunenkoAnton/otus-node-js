import { Schema, model, type InferSchemaType } from 'mongoose';
import { MOODS } from '../domain/entry.js';

const linkSchema = new Schema(
  {
    label: { type: String, required: true },
    url: {
      type: String,
      required: true,
      validate: (value: string): boolean => {
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
    _id: { type: Schema.Types.ObjectId, required: true },
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

entrySchema.index({ createdAt: -1 });
entrySchema.index({ mood: 1 });
entrySchema.index({ tags: 1 });

export type EntryDoc = InferSchemaType<typeof entrySchema>;

export const EntryModel = model<EntryDoc>('Entry', entrySchema);
