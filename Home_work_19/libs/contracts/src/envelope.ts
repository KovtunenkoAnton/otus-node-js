import { randomUUID } from 'node:crypto';
import { z } from 'zod';

export const ENVELOPE_VERSION = 1;

export interface Message<TType extends string = string, TPayload = unknown> {
  version: 1;
  type: TType;
  messageId: string;
  correlationId: string;
  timestamp: string;
  payload: TPayload;
  retryCount?: number;
}

export interface MessageDefinition<TType extends string = string, TPayload = unknown> {
  topic: TType;
  payloadSchema: z.ZodType<TPayload>;
  schema: z.ZodType<Message<TType, TPayload>>;
}

export function defineMessage<TType extends string, TPayload>(
  topic: TType,
  payloadSchema: z.ZodType<TPayload>,
): MessageDefinition<TType, TPayload> {
  return {
    topic,
    payloadSchema,
    schema: z.object({
      version: z.literal(ENVELOPE_VERSION),
      type: z.literal(topic),
      messageId: z.uuid(),
      correlationId: z.string().min(1),
      timestamp: z.iso.datetime(),
      payload: payloadSchema,
      retryCount: z.number().int().nonnegative().optional(),
    }),
  };
}

export function createMessage<TType extends string, TPayload>(
  def: MessageDefinition<TType, TPayload>,
  payload: TPayload,
  correlationId: string,
  messageId: string = randomUUID(),
): Message<TType, TPayload> {
  const message = {
    version: ENVELOPE_VERSION,
    type: def.topic,
    messageId,
    correlationId,
    timestamp: new Date().toISOString(),
    payload,
  };

  return def.schema.parse(message);
}

export function parseMessage<TType extends string, TPayload>(
  def: MessageDefinition<TType, TPayload>,
  raw: unknown,
): Message<TType, TPayload> {
  return def.schema.parse(raw);
}
