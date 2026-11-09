import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
import { AppService } from './app.service.js';

const createOrderSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().positive(),
  amount: z.number().positive(),
});

@Controller('orders')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  @HttpCode(202)
  async createOrder(@Body() body: unknown) {
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`),
      );
    }
    const order = await this.appService.createOrder(parsed.data);
    return { orderId: order.id, status: order.status };
  }

  @Get(':id')
  async getOrder(@Param('id') id: string) {
    return this.appService.getOrder(id);
  }

  @Post(':id/cancel')
  async cancelOrder(@Param('id') id: string) {
    return this.appService.cancelOrder(id);
  }
}
