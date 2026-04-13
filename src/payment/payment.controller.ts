import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('token')
  async getToken() {
    return await this.paymentService.getToken();
  }

  @Post('charge')
  async charge(@Body('access_token') access_token: string) {
    return await this.paymentService.charge(access_token);
  }
}
