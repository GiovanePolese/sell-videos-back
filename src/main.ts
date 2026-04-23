import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('sell videos API')
    .setDescription('API do meu Marketplace')
    .setVersion('1.0')
    .addBearerAuth(
      { 
        type: 'http', 
        scheme: 'bearer', 
        bearerFormat: 'JWT', 
        name: 'JWT',
        description: 'Insira o token JWT aqui',
        in: 'header',
      },
      'access-token', // Este é o ID que você usará nos seus Controllers
    )
    .build();

  // Configuração do CORS
  app.enableCors({
    origin: 'http://localhost:5173', // Origem do seu frontend (Vite)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Permite cookies ou cabeçalhos de autenticação
  });

  const document = SwaggerModule.createDocument(app, config);

  // Rota para ver a documentação no navegador
  SwaggerModule.setup('api', app, document);
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
