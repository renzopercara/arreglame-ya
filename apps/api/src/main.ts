
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    transform: true, // Transforma el payload JSON a instancias de clase DTO
    whitelist: true, // Elimina propiedades no definidas en el DTO
  }));

  // Habilitar CORS con origen configurable
  const corsOrigin = process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Prefijo global /api
  app.setGlobalPrefix('api');

  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  
  console.log(`✅ Backend corriendo en: http://localhost:${port}/graphql`);
  console.log(`✅ CORS habilitado para: ${corsOrigin.join(', ')}`);
  
}
bootstrap();
