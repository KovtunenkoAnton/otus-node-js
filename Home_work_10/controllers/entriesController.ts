import type { Request, Response } from 'express';
import type { z } from 'zod';
import { Entry, EntryModel, MOODS, entryInputSchema } from '../models/entries';

type EntryInput = z.infer<typeof entryInputSchema>;

type EntryListFilter = {
  deletedAt?: null;
  tags?: string;
  mood?: Entry['mood'];
  createdAt?: { $gte?: Date; $lte?: Date };
  $or?: { title?: RegExp; notes?: RegExp; content?: RegExp }[];
};

const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'title', 'mood'] as const;

const fail = (res: Response, status: number, message: string, details?: string[]): void => {
  res.status(status).json({ error: { message, ...(details ? { details } : {}) } });
};

const zodDetails = (error: z.ZodError): string[] =>
  error.issues.map((issue) => `${issue.path.map(String).join('.') || 'body'}: ${issue.message}`);

type EntryDocInput = {
  title?: string;
  content?: string;
  mood?: Entry['mood'];
  tags?: string[];
  notes?: string;
  links?: { label: string; url: string }[];
};

// явное undefined в update Mongo означает «удалить поле» — отбрасываем undefined
const toDocInput = (data: object): EntryDocInput =>
  Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as EntryDocInput;

type MongooseValidationError = Error & { errors: Record<string, { message: string }> };

const isValidationError = (err: unknown): err is MongooseValidationError =>
  err instanceof Error && err.name === 'ValidationError';

const isCastError = (err: unknown): err is Error => err instanceof Error && err.name === 'CastError';

const sendEntryError = (res: Response, err: unknown): void => {
  if (isValidationError(err)) {
    const details = Object.values(err.errors).map((e) => e.message);
    fail(res, 400, 'Validation failed', details);
    return;
  }
  if (isCastError(err)) {
    fail(res, 400, 'Invalid value', [err.message]);
    return;
  }
  fail(res, 500, 'Internal server error');
};

export const createEntry = async (
  req: Request<Record<string, never>, Response, EntryInput>,
  res: Response,
) => {
  const parsed = entryInputSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 400, 'Validation failed', zodDetails(parsed.error));
    return;
  }
  try {
    const entry = await EntryModel.create(toDocInput(parsed.data));
    res.status(201).json(entry);
  } catch (err) {
    sendEntryError(res, err);
  }
};

export const getEntriesList = async (req: Request, res: Response) => {
  const { tag, from, to, mood, q } = req.query;

  const page = Math.max(1, parseInt(String(req.query.page ?? 1), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? 20), 10) || 20));

  const sortRaw = typeof req.query.sort === 'string' && req.query.sort ? req.query.sort : '-createdAt';
  const sortDir = sortRaw.startsWith('-') ? -1 : 1;
  const sortField = sortRaw.replace(/^-/, '');
  if (!(SORTABLE_FIELDS as readonly string[]).includes(sortField)) {
    fail(res, 400, `Invalid sort: use one of ${SORTABLE_FIELDS.join(', ')} (prefix - for desc)`);
    return;
  }

  const filter: EntryListFilter = { deletedAt: null };

  if (typeof tag === 'string' && tag) {
    filter.tags = tag;
  }

  if (typeof mood === 'string' && mood) {
    if (!(MOODS as readonly string[]).includes(mood)) {
      fail(res, 400, `Invalid mood: use one of ${MOODS.join(', ')}`);
      return;
    }
    filter.mood = mood as Entry['mood'];
  }

  const fromTs = typeof from === 'string' && from ? new Date(from) : undefined;
  const toTs = typeof to === 'string' && to ? new Date(to) : undefined;
  if ((fromTs && Number.isNaN(fromTs.getTime())) || (toTs && Number.isNaN(toTs.getTime()))) {
    fail(res, 400, 'Invalid date in from/to');
    return;
  }
  if (fromTs && toTs) {
    filter.createdAt = { $gte: fromTs, $lte: toTs };
  } else if (fromTs) {
    filter.createdAt = { $gte: fromTs };
  } else if (toTs) {
    filter.createdAt = { $lte: toTs };
  }

  if (typeof q === 'string' && q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: rx }, { notes: rx }, { content: rx }];
  }

  const [items, total] = await Promise.all([
    EntryModel.find(filter)
      .sort({ [sortField]: sortDir })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    EntryModel.countDocuments(filter),
  ]);

  res.json({ items, page, limit, total });
};

export const getEntry = async (
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> => {
  const entry = await EntryModel.findOne({ _id: req.params.id, deletedAt: null });
  if (!entry) {
    fail(res, 404, 'Entry not found');
    return;
  }
  res.json(entry);
};

export const updateEntry = async (
  req: Request<{ id: string }, Response, EntryInput>,
  res: Response,
) => {
  const parsed = entryInputSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' })
    .safeParse(req.body);
  if (!parsed.success) {
    fail(res, 400, 'Validation failed', zodDetails(parsed.error));
    return;
  }
  try {
    const entry = await EntryModel.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      toDocInput(parsed.data),
      { returnDocument: 'after' },
    );
    if (!entry) {
      fail(res, 404, 'Entry not found');
      return;
    }
    res.json(entry);
  } catch (err) {
    sendEntryError(res, err);
  }
};

export const deleteEntry = async (
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> => {
  const entry = await EntryModel.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { deletedAt: new Date() },
    { returnDocument: 'after' },
  );
  if (!entry) {
    fail(res, 404, 'Entry not found');
    return;
  }
  res.status(204).send();
};
