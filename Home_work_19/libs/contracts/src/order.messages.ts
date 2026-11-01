import { z } from 'zod';
import { defineMessage } from './envelope';
import { TOPICS } from './topics';

export const orderCreateMessage = defineMessage(
  TOPICS.orderCreate,
  z.object({
    orderId: z.uuid(),
    productId: z.uuid(),
    quantity: z.number().int().positive(),
    amount: z.number().positive(),
  }),
);

export const orderConfirmedMessage = defineMessage(
  TOPICS.orderConfirmed,
  z.object({
    orderId: z.uuid(),
  }),
);

export const orderRejectedMessage = defineMessage(
  TOPICS.orderRejected,
  z.object({
    orderId: z.uuid(),
    reason: z.string().min(1),
  }),
);

export const orderCancelledMessage = defineMessage(
  TOPICS.orderCancelled,
  z.object({
    orderId: z.uuid(),
    reason: z.string().min(1),
  }),
);
