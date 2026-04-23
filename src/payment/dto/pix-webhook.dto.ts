import { ApiProperty } from "@nestjs/swagger";

export class PixWebhookItemDto {
  @ApiProperty({ 
    example: '8c655575990f4f6f9164274901315351', 
    description: 'ID da transação' 
  })
  txid: string;

  @ApiProperty({ 
    example: 'ATIVA', 
    description: 'Status da ordem'
  })
  status?: string;
}

export class PixWebhookDto {
  pix: PixWebhookItemDto[];
}
