export const TOPICS = {
  orderCreate: 'order.create',
  inventoryReserve: 'inventory.reserve',
  inventoryRelease: 'inventory.release',
  paymentAuthorize: 'payment.authorize',
  notificationSend: 'notification.send',
  inventoryReserved: 'inventory.reserved',
  inventoryFailed: 'inventory.failed',
  paymentAuthorized: 'payment.authorized',
  paymentFailed: 'payment.failed',
  orderConfirmed: 'order.confirmed',
  orderRejected: 'order.rejected',
  orderCancelled: 'order.cancelled',
  notificationSent: 'notification.sent',
} as const;

export type Topic = (typeof TOPICS)[keyof typeof TOPICS];

export const dlqTopic = (topic: string): string => `${topic}.dlq`;
