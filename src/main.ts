import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Configuração do CORS
  app.enableCors({
    origin: 'http://localhost:5173', // Origem do seu frontend (Vite)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Permite cookies ou cabeçalhos de autenticação
  });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
