import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { validateEnvironment } from './env.validation';
import { AllExceptionsFilter } from './common/filters/exception.filter';

/**
 * Bootstrap function - Deterministic startup with explicit logging
 * 
 * PRINCIPLE: "Better to NOT start than to start incorrectly"
 * 
 * This function follows production-grade practices:
 * - Validates environment before starting
 * - Logs every initialization step
 * - Fails explicitly with clear error messages
 * - Never silently swallows errors
 */
async function bootstrap() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🚀 Starting ArreglaMe Ya API Server                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // PHASE 1: Validate environment variables
    console.log('📋 Phase 1: Validating environment configuration...');
    const env = validateEnvironment();
    console.log('✅ Environment validation passed\n');

    // PHASE 2: Create NestJS application
    console.log('📋 Phase 2: Creating NestJS application...');
    const app = await NestFactory.create(AppModule, {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });
    console.log('✅ NestJS application created\n');

    // PHASE 3: Configure global exception filters
    console.log('📋 Phase 3: Configuring global exception filters...');
    app.useGlobalFilters(new AllExceptionsFilter());
    console.log('✅ Exception filters configured\n');

    // PHASE 4: Configure global pipes
    console.log('📋 Phase 4: Configuring validation pipes...');
    app.useGlobalPipes(new ValidationPipe({
      transform: true, // Transform JSON payload to DTO class instances
      whitelist: true, // Strip properties not defined in DTO
      forbidNonWhitelisted: false, // Don't throw on extra properties (more forgiving)
      transformOptions: {
        enableImplicitConversion: false, // Explicit type conversion only
      },
    }));
    console.log('✅ Validation pipes configured\n');

    // PHASE 5: Configure CORS
    console.log('📋 Phase 5: Configuring CORS...');
    const corsOrigin = env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [
      'http://localhost:3000', // Frontend default
    ];

    app.enableCors({
      origin: corsOrigin,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });
    console.log(`✅ CORS enabled for: ${corsOrigin.join(', ')}\n`);

    // PHASE 6: Set global prefix
    console.log('📋 Phase 6: Setting API prefix...');
    app.setGlobalPrefix('api', { exclude: ['graphql', 'health'] });
    console.log('✅ Global prefix set to /api (excluding /graphql and /health)\n');

    // PHASE 7: Start listening on port
    const port = Number(env.API_PORT ?? 3001);
    console.log(`📋 Phase 7: Starting server on port ${port}...`);
    
    // This will throw if port is already in use or other issues
    await app.listen(port);
    
    // PHASE 8: Success! Server is listening
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ SERVER STARTED SUCCESSFULLY                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🚀 API Server:       http://localhost:${port}`);
    console.log(`🎨 GraphQL Playground: http://localhost:${port}/graphql`);
    console.log(`💚 Health Check:     http://localhost:${port}/health`);
    console.log(`🌍 Environment:      ${env.NODE_ENV}`);
    console.log('');
    console.log('Ready to accept connections!');
    console.log('Press CTRL+C to stop the server.');
    console.log('════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    // EXPLICIT ERROR HANDLING - Never silent failures
    console.error('\n╔════════════════════════════════════════════════════════════╗');
    console.error('║  ❌ SERVER FAILED TO START                                 ║');
    console.error('╚════════════════════════════════════════════════════════════╝\n');
    console.error('Error details:');
    console.error(error);
    console.error('\n');
    
    // Exit with non-zero code so the process manager knows we failed
    process.exit(1);
  }
}

// Start the bootstrap process
bootstrap();
