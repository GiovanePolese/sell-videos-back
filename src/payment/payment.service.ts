import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentService {
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly password: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = 'https://pix-h.api.efipay.com.br';
    this.username = this.configService.getOrThrow('EFI_ACCESS_KEY');
    this.password = this.configService.getOrThrow('EFI_SECRET_KEY');
  }

  // Método para criar headers básicos (Basic Auth)
  private getBasicAuthHeaders(): Record<string, string> {
    return {
      Authorization: 'Basic ' + Buffer.from(`${this.username}:${this.password}`).toString('base64'),
      'Content-Type': 'application/json',
    };
  }

  // Método para criar headers Bearer Token
  private getBearerHeaders(access_token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    };
  }

  async getToken(): Promise<any> {
    const url = `${this.baseUrl}/oauth/token`;
    const headers = this.getBasicAuthHeaders();

    const body = {
      grant_type: 'client_credentials',
    };

    return this.makePostRequest(url, body, headers, 'Erro ao obter o token');
  }

  async charge(access_token: string): Promise<any> {
    const url = `${this.baseUrl}/v2/cob`;
    const headers = this.getBearerHeaders(access_token);
    
    const body = {
      "calendario": {
        "expiracao": 3600
      },
      "devedor": {
        "cpf": "12345678909",
        "nome": "Francisco da Silva"
      },
      "valor": {
        "original": "1.00"
      },
      "chave": "00677844107",
      "solicitacaoPagador": "Informe o número ou identificador do pedido."
    }

    const chargeResponse = await this.makePostRequest(url, body, headers, 'Erro ao gerar cobrança');
    const locId = chargeResponse?.loc?.id;

    if (!locId) {
      throw new Error('ID do loc não encontrado na resposta da cobrança.');
    }
    const qrCodeResponse = await this.generateQRCode(locId.toString(), access_token);

    // Combina os resultados em um único objeto
    return {
      ...chargeResponse,  // Retorna todos os dados da resposta da cobrança
      qrCode: qrCodeResponse,  // Adiciona o QR Code retornado pela função generateQRCode
    };
  }

  private async generateQRCode(id: string, access_token: string): Promise<any>{
    const url = `${this.baseUrl}/v2/loc/${id}/qrcode`;
    const headers = this.getBearerHeaders(access_token);

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { headers }),
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao buscar QR Code para o ID ${id}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  private async makePostRequest(
    url: string,
    body: any,
    headers: Record<string, string>,
    errorMessage: string,
  ): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, body, { headers }),
      );
      return response.data;
    } catch (error) {
      console.error(errorMessage, error.response?.data || error.message);
      throw error;
    }
  }
}
