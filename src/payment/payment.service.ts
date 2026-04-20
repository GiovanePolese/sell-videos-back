import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { CreatePixChargeDto } from './dto/create-pix-charge.dto';
import { CreatePaymentResponseDto } from './dto/create-payment-response.dto';
import { PixWebhookDto } from './dto/pix-webhook.dto';
import { Order } from '../orders/entities/order.entity';

interface EfiSdkClient {
  pixCreateImmediateCharge(params: { txid: string }, body: Record<string, unknown>): Promise<any>;
  pixGenerateQRCode(params: { id: number | string }): Promise<any>;
}

@Injectable()
export class PaymentService {
  private efiClient: EfiSdkClient | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  private validateCreatePayload(payload: CreatePixChargeDto): void {
    if (!Number.isFinite(payload?.amount) || payload.amount <= 0) {
      throw new BadRequestException('amount deve ser um número maior que zero.');
    }

    if (!payload?.payerDocument || payload.payerDocument.length > 11) {
      throw new BadRequestException('payerDocument é obrigatório e deve ter até 11 caracteres.');
    }

    if (!payload?.payerName || payload.payerName.length > 150) {
      throw new BadRequestException('payerName é obrigatório e deve ter até 150 caracteres.');
    }

    if (payload.description && payload.description.length > 140) {
      throw new BadRequestException('description deve ter no máximo 140 caracteres.');
    }
  }

  private validateWebhookPayload(payload: PixWebhookDto): void {
    if (!Array.isArray(payload?.pix)) {
      throw new BadRequestException('Payload de webhook inválido. Campo pix precisa ser uma lista.');
    }
  }

  async createPixCharge(payload: CreatePixChargeDto): Promise<CreatePaymentResponseDto> {
    this.validateCreatePayload(payload);
    const txid = randomUUID().replace(/-/g, '').slice(0, 32);
    const amount = payload.amount.toFixed(2);

    const efiClient = this.getEfiClient();

    const charge = await efiClient.pixCreateImmediateCharge(
      { txid },
      {
        calendario: { expiracao: 3600 },
        devedor: {
          cpf: payload.payerDocument,
          nome: payload.payerName,
        },
        valor: { original: amount },
        chave: this.configService.getOrThrow<string>('EFI_PIX_KEY'),
        solicitacaoPagador:
          payload.description ?? 'Informe o número ou identificador do pedido.',
      },
    );

    const qrCode = await efiClient.pixGenerateQRCode({
      id: charge.loc?.id,
    });

    await this.orderRepository.save({
      txid,
      amount,
      payer_document: payload.payerDocument,
      payer_name: payload.payerName,
      status: charge.status ?? 'ATIVA',
    });

    return {
      txid,
      copyAndPaste: qrCode.qrcode,
      qrcode: qrCode.imagemQrcode,
    };
  }

  async processWebhook(payload: PixWebhookDto): Promise<{ processed: number }> {
    this.validateWebhookPayload(payload);
    let processed = 0;

    for (const pixEvent of payload.pix ?? []) {
      const normalizedStatus = this.normalizeStatus(pixEvent.status);
      if (normalizedStatus !== 'CONCLUIDO') {
        continue;
      }

      const result = await this.orderRepository.update(
        { txid: pixEvent.txid },
        { status: 'CONCLUIDO' },
      );

      if (result.affected) {
        processed += result.affected;
      }
    }

    return { processed };
  }

  private getEfiClient(): EfiSdkClient {
    if (!this.efiClient) {
      this.efiClient = this.buildEfiClient();
    }

    return this.efiClient;
  }

  private normalizeStatus(status?: string): string {
    return (status ?? '').normalize('NFD').replace(/[^\w]/g, '').toUpperCase();
  }

  private buildEfiClient(): EfiSdkClient {
    let EfiPay: new (options: Record<string, unknown>) => EfiSdkClient;

    try {
      EfiPay = require('efi-node-sdk');
    } catch {
      throw new InternalServerErrorException(
        'Dependência efi-node-sdk não encontrada. Instale o pacote para habilitar o Pix.',
      );
    }

    const options = {
      sandbox: this.configService.get<string>('EFI_SANDBOX', 'true') === 'true',
      client_id: this.configService.getOrThrow<string>('EFI_CLIENT_ID'),
      client_secret: this.configService.getOrThrow<string>('EFI_CLIENT_SECRET'),
      certificate: this.configService.getOrThrow<string>('EFI_CERTIFICATE_PATH'),
    };

    return new EfiPay(options) as EfiSdkClient;
  }
}
