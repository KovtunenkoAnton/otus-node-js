import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

type PaymentResult =
  | { ok: true; paymentId: string }
  | { ok: false; reason: string };

@Injectable()
export class PaymentService {
  private static readonly SUCCESS_RATE = 0.8;

  authorize(amount: number): PaymentResult {
    return Math.random() < PaymentService.SUCCESS_RATE
      ? { ok: true, paymentId: randomUUID() }
      : { ok: false, reason: `payment provider declined (simulated, amount=${amount})` };
  }
}
