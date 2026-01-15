import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { JobsModule } from './jobs/jobs.module';
import { WorkerModule } from './worker/worker.module';
import { PrismaService } from './prisma/prisma.service';
import { ConfigModule } from './config/config.module';
import { PubSubModule } from './common/pubsub.module';
import { LegalModule } from './legal/legal.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BillingModule } from './billing/billing.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ServiceCategoriesModule } from './service-categories/service-categories.module';
import GraphQLJSON from 'graphql-type-json';
import { join } from 'path';

@Module({
  imports: [
    PubSubModule,
    ConfigModule,
    HealthModule,
    JobsModule,
    WorkerModule,
    LegalModule,
    AuthModule,
    NotificationsModule,
    BillingModule,
    WebhooksModule,
    ServiceCategoriesModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      // EXPLICIT DRIVER - Never rely on defaults in production
      driver: ApolloDriver,
      
      // CODE FIRST APPROACH - Schema generated from TypeScript decorators
      autoSchemaFile: join(process.cwd(), 'src/schema.graphql'),
      
      // Sort schema for consistent output
      sortSchema: true,
      
      // Custom scalar resolvers
      resolvers: { JSON: GraphQLJSON },
      
      // Playground configuration - enabled in development, disabled in production
      playground: process.env.NODE_ENV !== 'production',
      
      // Introspection - enabled in development for tooling, disabled in production for security
      introspection: process.env.NODE_ENV !== 'production',
      
      // Context function - adds request to context for auth
      context: ({ req, res }) => ({ req, res }),
      
      // Subscriptions via graphql-ws (modern protocol)
      subscriptions: {
        'graphql-ws': {
          path: '/graphql',
        },
      },
      
      // Format errors with more info in development
      formatError: (error) => {
        // Extract HTTP exception information if available
        const originalError = error.extensions?.originalError as any;
        const statusCode = originalError?.statusCode;
        
        // Map HTTP status codes to GraphQL error codes
        let code = error.extensions?.code;
        if (!code && statusCode) {
          switch (statusCode) {
            case 409:
              code = 'CONFLICT';
              break;
            case 401:
              code = 'UNAUTHORIZED';
              break;
            case 400:
              code = 'BAD_REQUEST';
              break;
            case 403:
              code = 'FORBIDDEN';
              break;
            case 404:
              code = 'NOT_FOUND';
              break;
            default:
              code = 'INTERNAL_SERVER_ERROR';
          }
        }
        
        // In production, don't expose internal error details
        if (process.env.NODE_ENV === 'production') {
          return {
            message: error.message,
            extensions: {
              code,
            },
          };
        }
        
        // In development, return full error for debugging but ensure code is present
        return {
          ...error,
          extensions: {
            ...error.extensions,
            code,
          },
        };
      },
      
      // Include stack traces in development
      debug: process.env.NODE_ENV !== 'production',
      
      // Field resolver options
      fieldResolverEnhancers: ['guards', 'interceptors', 'filters'],
    }),
  ],
  providers: [PrismaService],
})
export class AppModule {}

