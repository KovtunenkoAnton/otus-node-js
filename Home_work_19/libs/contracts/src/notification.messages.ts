import { z } from 'zod';
import { defineMessage } from './envelope';
import { TOPICS } from './topics';

export const notificationSendMessage = defineMessage(
  TOPICS.notificationSend,
  z.object({
    orderId: z.uuid(),
    message: z.string().min(1),
  }),
);

export const notificationSentMessage = defineMessage(
  TOPICS.notificationSent,
  z.object({
    orderId: z.uuid(),
  }),
);
