import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './user/entities/user.entity';
import { Files as FilesEntity } from './files/entities/files.entity';
import { UserModule } from './user/user.module';
import { FilesModule } from './files/files.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'myadmin',
      database: 'sellvideos',
      entities: [Users, FilesEntity], 
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Users, FilesEntity]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UserModule,
    FilesModule,
    AuthModule,
    PaymentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
