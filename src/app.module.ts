import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './user/entities/user.entity';
import { Album } from './files/entities/album.entity';
import { VideoFile } from './files/entities/video-file.entity';
import { Order } from './orders/entities/order.entity';
import { UserModule } from './user/user.module';
import { FilesModule } from './files/files.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PaymentModule } from './payment/payment.module';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'myadmin',
      database: 'sellvideos',
      entities: [Users, Album, VideoFile, Order],
      synchronize: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      path: '/graphql',
      context: ({ req, res }) => ({ req, res }),
      playground: true,
      introspection: true,
      sortSchema: true,
    }),
    TypeOrmModule.forFeature([Users, Album, VideoFile, Order]),
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
