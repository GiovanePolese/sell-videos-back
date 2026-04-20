import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePixChargeDto } from './dto/create-pix-charge.dto';
import { PixWebhookDto } from './dto/pix-webhook.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('pix')
  createPixCharge(@Body() payload: CreatePixChargeDto) {
    return this.paymentService.createPixCharge(payload);
  }

  @Post('webhook/efi')
  @HttpCode(200)
  handleEfiWebhook(@Body() payload: PixWebhookDto) {
    return this.paymentService.processWebhook(payload);
  }
}
