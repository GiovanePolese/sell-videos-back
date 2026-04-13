import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { HttpModule } from '@nestjs/axios';
import { PaymentController } from './payment.controller';

@Module({
  imports: [
    HttpModule.register({
      httpsAgent: new (require('https').Agent)({
        pfx: require('fs').readFileSync('certificates/homologacao-679036-homolog.p12'),
        passphrase: '',
      }),
    }),
  ],
  controllers: [PaymentController],
  providers: [PaymentService]
})
export class PaymentModule {}
