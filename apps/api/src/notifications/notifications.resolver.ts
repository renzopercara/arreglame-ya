import { Resolver, Query, Mutation, Subscription, Args, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards, Inject } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { GraphQLJSON } from 'graphql-type-json';
import { PubSubEngine } from 'graphql-subscriptions';

@ObjectType('Notification')
export class NotificationResponse {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field()
  title: string;

  @Field()
  message: string;

  @Field()
  type: string;

  @Field()
  read: boolean;

  @Field(() => GraphQLJSON, { nullable: true })
  data?: any;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

@ObjectType('UnreadCountResult')
export class UnreadCountResponse {
  @Field()
  count: number;
}

@ObjectType('MutationResponse')
export class MutationResponse {
  @Field()
  success: boolean;
}

@Resolver()
@UseGuards(AuthGuard)
export class NotificationsResolver {
  constructor(
    private notificationsService: NotificationsService,
    @Inject('PUB_SUB') private pubSub: PubSubEngine,
  ) {}

  @Query(() => [NotificationResponse])
  async getNotifications(
    @CurrentUser() user: any,
    @Args('limit', { nullable: true }) limit?: number,
  ): Promise<NotificationResponse[]> {
    return this.notificationsService.getNotifications(user.sub, limit);
  }

  @Query(() => UnreadCountResponse)
  async getUnreadCount(@CurrentUser() user: any): Promise<UnreadCountResponse> {
    const count = await this.notificationsService.getUnreadCount(user.sub);
    return { count };
  }

  @Mutation(() => NotificationResponse)
  async markNotificationAsRead(
    @CurrentUser() user: any,
    @Args('notificationId') notificationId: string,
  ): Promise<NotificationResponse> {
    return this.notificationsService.markAsRead(notificationId, user.sub);
  }

  @Mutation(() => MutationResponse)
  async markAllNotificationsAsRead(@CurrentUser() user: any): Promise<MutationResponse> {
    await this.notificationsService.markAllAsRead(user.sub);
    return { success: true };
  }

  @Mutation(() => MutationResponse)
  async deleteNotification(
    @CurrentUser() user: any,
    @Args('notificationId') notificationId: string,
  ): Promise<MutationResponse> {
    await this.notificationsService.deleteNotification(notificationId, user.sub);
    return { success: true };
  }

  @Mutation(() => Boolean)
  async registerDeviceToken(
    @CurrentUser() user: any,
    @Args('token') token: string,
    @Args('platform', { nullable: true, defaultValue: 'web' }) platform?: string,
  ): Promise<boolean> {
    return this.notificationsService.registerDeviceToken(
      user.sub,
      token,
      platform || 'web',
    );
  }

  /**
   * GraphQL Subscription for real-time notifications
   * Replaces push notifications with WebSocket-based updates
   */
  @Subscription(() => NotificationResponse, {
    name: 'notificationReceived',
    resolve: (payload) => payload.notificationReceived,
  })
  notificationReceived(@CurrentUser() user: any) {
    return this.pubSub.asyncIterator(`NOTIFICATION_${user.sub}`);
  }
}

