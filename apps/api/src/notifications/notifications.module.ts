import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsResolver } from './notifications.resolver';
import { PrismaService } from '../prisma/prisma.service';
import { PubSubModule } from '../common/pubsub.module';

@Module({
  imports: [PubSubModule],
  providers: [NotificationsService, NotificationsResolver, PrismaService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
