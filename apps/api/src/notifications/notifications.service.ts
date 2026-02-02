import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PubSubEngine } from 'graphql-subscriptions';

@Injectable()
export class NotificationsService {
  private logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    @Inject('PUB_SUB') private pubSub: PubSubEngine,
  ) {}

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: string = 'INFO',
    data?: any,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        data: data || undefined,
      },
    });
  }

  async getNotifications(userId: string, limit: number = 20) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notificación no encontrada');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async deleteNotification(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notificación no encontrada');
    }

    return this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Register device token for push notifications
   * Note: With GraphQL subscriptions, this is mainly for tracking connected clients
   */
  async registerDeviceToken(
    userId: string,
    token: string,
    platform: string,
  ): Promise<boolean> {
    try {
      // Check if token already exists
      const existing = await this.prisma.deviceToken.findUnique({
        where: { token },
      });

      if (existing) {
        // Update existing token
        await this.prisma.deviceToken.update({
          where: { token },
          data: {
            userId,
            platform,
            active: true,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new token
        await this.prisma.deviceToken.create({
          data: {
            userId,
            token,
            platform,
            active: true,
          },
        });
      }

      this.logger.log(`Device token registered for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to register device token', error);
      return false;
    }
  }

  /**
   * Get active device tokens for a user
   */
  async getActiveDeviceTokens(userId: string): Promise<string[]> {
    const devices = await this.prisma.deviceToken.findMany({
      where: {
        userId,
        active: true,
      },
      select: {
        token: true,
      },
    });

    return devices.map((d) => d.token);
  }

  /**
   * Send real-time notification via GraphQL Subscription
   * This replaces push notifications with subscription-based updates
   */
  async sendRealtimeNotification(
    userId: string,
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    try {
      // Create in-app notification
      const notification = await this.createNotification(userId, title, body, 'REALTIME', data);
      
      // Publish to GraphQL subscription for real-time delivery
      await this.pubSub.publish(`NOTIFICATION_${userId}`, {
        notificationReceived: notification,
      });
      
      this.logger.log(`Real-time notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to send real-time notification', error);
    }
  }

  /**
   * Notify professional about new job matching their criteria
   */
  async notifyProfessionalAboutNewJob(
    professionalId: string,
    jobData: {
      jobId: string;
      clientName: string;
      jobType: string;
      location: string;
      distance: number;
    },
  ): Promise<void> {
    const title = 'Nuevo Trabajo Disponible';
    const body = `${jobData.jobType} - ${jobData.clientName} (${jobData.distance.toFixed(1)}km)`;
    
    await this.sendRealtimeNotification(
      professionalId,
      title,
      body,
      {
        type: 'NEW_JOB',
        jobId: jobData.jobId,
        deeplink: `/worker/jobs/${jobData.jobId}`,
      },
    );
  }
}
