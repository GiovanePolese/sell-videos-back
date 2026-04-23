import { ApiProperty } from '@nestjs/swagger';

export class CreatePixChargeDto {
  @ApiProperty({ 
    example: 150.50, 
    description: 'O valor da cobrança em reais',
    type: Number 
  })
  amount: number;

  @ApiProperty({ 
    example: '12345678901', 
    description: 'CPF do pagador (apenas números)',
    minLength: 11,
    maxLength: 11 
  })
  payerDocument: string;

  @ApiProperty({ 
    example: 'Giovane da Silva', 
    description: 'Nome completo do cliente que está comprando o vídeo' 
  })
  payerName: string;

  @ApiProperty({ 
    example: 'Compra do vídeo: Workshop de Edição 2026', 
    description: 'Descrição opcional que aparecerá no extrato do cliente',
    required: false 
  })
  description?: string;
}