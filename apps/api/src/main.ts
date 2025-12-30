
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
    'http://localhost:3000', // Frontend Next.js
  ];

  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Prefijo global /api sin afectar /graphql y /health
  app.setGlobalPrefix('api', { exclude: ['graphql', 'health'] });

  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  
  console.log(`\n🚀 ========================================`);
  console.log(`✅ Backend corriendo en: http://localhost:${port}`);
  console.log(`✅ GraphQL Playground: http://localhost:${port}/graphql`);
  console.log(`✅ Health Check: http://localhost:${port}/health`);
  console.log(`✅ CORS habilitado para: ${corsOrigin.join(', ')}`);
  console.log(`========================================\n`);
  
}
bootstrap();
