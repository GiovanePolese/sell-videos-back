export class PixWebhookItemDto {
  txid: string;
  status?: string;
}

export class PixWebhookDto {
  pix: PixWebhookItemDto[];
}
