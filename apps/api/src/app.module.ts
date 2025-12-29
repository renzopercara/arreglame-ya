
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
import GraphQLJSON from 'graphql-type-json';

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
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      resolvers: { JSON: GraphQLJSON },
      typePaths: ['./**/*.graphql'],
      definitions: {
        path: 'src/graphql.ts',
      },
      subscriptions: {
        'graphql-ws': true,
      },
    }),
  ],
  providers: [PrismaService],
})
export class AppModule {}

