import { z } from 'zod';
import { defineMessage } from './envelope';
import { TOPICS } from './topics';

const itemPayload = {
  orderId: z.uuid(),
  productId: z.uuid(),
  quantity: z.number().int().positive(),
} as const;

export const inventoryReserveMessage = defineMessage(
  TOPICS.inventoryReserve,
  z.object(itemPayload),
);

export const inventoryReleaseMessage = defineMessage(
  TOPICS.inventoryRelease,
  z.object(itemPayload),
);

export const inventoryReservedMessage = defineMessage(
  TOPICS.inventoryReserved,
  z.object(itemPayload),
);

export const inventoryFailedMessage = defineMessage(
  TOPICS.inventoryFailed,
  z.object({ ...itemPayload, reason: z.string().min(1) }),
);
