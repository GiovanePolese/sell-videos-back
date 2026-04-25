import { Body, Controller, HttpCode, Post, Get, Param, Req, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePixChargeDto } from './dto/create-pix-charge.dto';
import { PixWebhookDto } from './dto/pix-webhook.dto';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    username: string;
  };
}

@ApiTags('Payments') // Organiza estas rotas na pasta "Payments" no Postman
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('pix')
  @UseGuards(JwtAuthGuard) // Protege a rota e injeta o req.user
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cria uma cobrança PIX para venda de vídeo' })
  createPixCharge(@Body() payload: CreatePixChargeDto, @Req() req: AuthenticatedRequest) {
    
    const user = req.user as any; 
    const idDoUsuarioLogado = user.userId; 

    return this.paymentService.createPixCharge(payload, idDoUsuarioLogado);
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