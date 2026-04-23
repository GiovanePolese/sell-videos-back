import { Body, Controller, HttpCode, Post, Get, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePixChargeDto } from './dto/create-pix-charge.dto';
import { PixWebhookDto } from './dto/pix-webhook.dto';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Payments') // Organiza estas rotas na pasta "Payments" no Postman
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('pix')
  @ApiBearerAuth('access-token') // Indica que esta rota exige o Token JWT
  @ApiOperation({ summary: 'Cria uma cobrança PIX para venda de vídeo' })
  @ApiResponse({ status: 201, description: 'Cobrança criada com sucesso.' })
  createPixCharge(@Body() payload: CreatePixChargeDto) {
    return this.paymentService.createPixCharge(payload);
  }

  @Get('pix/:txid')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Busca os detalhes de uma cobrança PIX através do TXID' })
  @ApiResponse({ status: 200, description: 'Dados da cobrança retornados com sucesso.' })
  @ApiResponse({ status: 404, description: 'Cobrança não encontrada.' })
  getPixChargeByTxid(@Param('txid') txid: string) {
    return this.paymentService.getChargeByTxid(txid);
  }

  @Post('webhook/efi')
  @HttpCode(200)
  @ApiOperation({ summary: 'Recebe notificações da Efí (Webhook)' })
  @ApiResponse({ status: 200, description: 'Webhook processado.' })
  // Note que aqui NÃO usamos o @ApiBearerAuth, pois o servidor da Efí não envia seu JWT
  handleEfiWebhook(@Body() payload: PixWebhookDto) {
    return this.paymentService.processWebhook(payload);
  }
}