import type { Request, Response } from 'express';
import type { z, ZodError } from 'zod';
import { HttpError } from '../http/errors.js';
import type { EntriesService } from '../services/entries.service.js';
import { entryBodySchema, entryUpdateSchema } from '../validation/entry-body.js';
import { entryIdSchema } from '../validation/entry-id.js';
import { entryListQuerySchema } from '../validation/entry-query.js';

const toValidationError = (error: ZodError): HttpError =>
  new HttpError(
    400,
    'Validation failed',
    error.issues.map((issue) => `${issue.path.map(String).join('.') || 'body'}: ${issue.message}`),
  );

const parse = <T extends z.ZodType>(schema: T, data: unknown): z.infer<T> => {
  const result = schema.safeParse(data);
  if (!result.success) throw toValidationError(result.error);
  return result.data;
};

export const createEntriesController = (entriesService: EntriesService) => ({
  create: async (req: Request, res: Response): Promise<void> => {
    const input = parse(entryBodySchema, req.body);
    res.status(201).json(await entriesService.create(input));
  },
  list: async (req: Request, res: Response): Promise<void> => {
    const query = parse(entryListQuerySchema, req.query);
    res.json(await entriesService.list(query));
  },
  get: async (req: Request, res: Response): Promise<void> => {
    const id = parse(entryIdSchema, req.params.id);
    res.json(await entriesService.getById(id));
  },
  update: async (req: Request, res: Response): Promise<void> => {
    const id = parse(entryIdSchema, req.params.id);
    const patch = parse(entryUpdateSchema, req.body);
    res.json(await entriesService.update(id, patch));
  },
  remove: async (req: Request, res: Response): Promise<void> => {
    const id = parse(entryIdSchema, req.params.id);
    await entriesService.remove(id);
    res.status(204).send();
  },
});

export type EntriesController = ReturnType<typeof createEntriesController>;
