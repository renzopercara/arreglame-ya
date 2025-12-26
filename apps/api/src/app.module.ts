
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

@Module({
  imports: [
    PubSubModule,
    ConfigModule,
    HealthModule,
    JobsModule,
    WorkerModule,
    LegalModule,
    AuthModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
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
