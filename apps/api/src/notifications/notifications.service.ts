import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Push Notification Provider Interface
 * Allows easy replacement of notification provider (Firebase, OneSignal, etc.)
 */
interface IPushProvider {
  sendPushNotification(tokens: string[], title: string, body: string, data?: any): Promise<void>;
}

/**
 * Firebase Admin SDK Push Provider (Placeholder)
 * In production, initialize with Firebase Admin credentials
 */
class FirebasePushProvider implements IPushProvider {
  private logger = new Logger(FirebasePushProvider.name);

  async sendPushNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    // TODO: Initialize Firebase Admin SDK
    // const admin = require('firebase-admin');
    // await admin.messaging().sendMulticast({
    //   tokens,
    //   notification: { title, body },
    //   data,
    // });
    
    this.logger.log(`[Firebase Placeholder] Sending push to ${tokens.length} devices`);
    this.logger.log(`Title: ${title}, Body: ${body}`);
    this.logger.log(`Data:`, data);
  }
}

@Injectable()
export class NotificationsService {
  private pushProvider: IPushProvider;
  private logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {
    this.pushProvider = new FirebasePushProvider();
  }

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
   * Send push notification to user's devices
   */
  async sendPushNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    try {
      const tokens = await this.getActiveDeviceTokens(userId);
      
      if (tokens.length === 0) {
        this.logger.log(`No active devices for user ${userId}`);
        return;
      }

      await this.pushProvider.sendPushNotification(tokens, title, body, data);
      
      // Also create in-app notification
      await this.createNotification(userId, title, body, 'PUSH', data);
    } catch (error) {
      this.logger.error('Failed to send push notification', error);
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
    
    await this.sendPushNotificationToUser(
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
