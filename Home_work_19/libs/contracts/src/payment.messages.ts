import { z } from 'zod';
import { defineMessage } from './envelope';
import { TOPICS } from './topics';

export const paymentAuthorizeMessage = defineMessage(
  TOPICS.paymentAuthorize,
  z.object({
    orderId: z.uuid(),
    amount: z.number().positive(),
  }),
);

export const paymentAuthorizedMessage = defineMessage(
  TOPICS.paymentAuthorized,
  z.object({
    orderId: z.uuid(),
    amount: z.number().positive(),
    paymentId: z.string().min(1),
  }),
);

export const paymentFailedMessage = defineMessage(
  TOPICS.paymentFailed,
  z.object({
    orderId: z.uuid(),
    amount: z.number().positive(),
    reason: z.string().min(1),
  }),
);
