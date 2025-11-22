import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateNotificationDto, NotificationType, NotificationPriority } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationPreferencesDto } from './dto/notification-preferences.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private tenantPrisma: TenantPrismaService) {}

  /**
   * Create and send a notification
   */
  async create(tenantId: string, createDto: CreateNotificationDto) {
    // Check user notification preferences
    const preferences = await this.getUserPreferences(tenantId, createDto.user_id);

    // Check if this notification type is enabled
    const isEnabled = this.isNotificationEnabled(preferences, createDto.type);

    if (!isEnabled) {
      this.logger.log(`Notification type ${createDto.type} disabled for user ${createDto.user_id}`);
      return null;
    }

    // Create notification record
    const notification = await this.tenantPrisma.create(tenantId, 'Notification', {
      data: {
        user_id: createDto.user_id,
        type: createDto.type,
        title: createDto.title,
        message: createDto.message,
        priority: createDto.priority || NotificationPriority.MEDIUM,
        entity_type: createDto.entity_type,
        entity_id: createDto.entity_id,
        action_url: createDto.action_url,
        metadata: createDto.metadata || {},
        is_read: false,
        scheduled_at: createDto.scheduled_at,
        created_at: new Date(),
      },
    });

    // Send notification immediately if not scheduled
    if (!createDto.scheduled_at) {
      await this.sendNotification(tenantId, notification);
    }

    return notification;
  }

  /**
   * Get all notifications for a user
   */
  async findAll(tenantId: string, filters?: any) {
    const where: any = {};

    if (filters?.user_id) {
      where.user_id = filters.user_id;
    }

    if (filters?.is_read !== undefined) {
      where.is_read = filters.is_read === 'true';
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    return this.tenantPrisma.findMany(tenantId, 'Notification', {
      where,
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  /**
   * Get a single notification
   */
  async findOne(tenantId: string, id: string) {
    const notification = await this.tenantPrisma.findOne(tenantId, 'Notification', {
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  /**
   * Update notification (mark as read, etc.)
   */
  async update(tenantId: string, id: string, updateDto: UpdateNotificationDto) {
    await this.findOne(tenantId, id);

    const updateData: any = { ...updateDto };

    // Auto-set read_at if marking as read
    if (updateDto.is_read && !updateDto.read_at) {
      updateData.read_at = new Date();
    }

    return this.tenantPrisma.update(tenantId, 'Notification', {
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete a notification
   */
  async delete(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.tenantPrisma.delete(tenantId, 'Notification', {
      where: { id },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(tenantId: string, id: string) {
    return this.update(tenantId, id, {
      is_read: true,
      read_at: new Date().toISOString(),
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(tenantId: string, userId: string) {
    const notifications = await this.findAll(tenantId, {
      user_id: userId,
      is_read: 'false',
    });

    const promises = notifications.map((notification: any) =>
      this.markAsRead(tenantId, notification.id)
    );

    return Promise.all(promises);
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(tenantId: string, userId: string): Promise<number> {
    return this.tenantPrisma.count(tenantId, 'Notification', {
      user_id: userId,
      is_read: false,
    });
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(tenantId: string, userId: string): Promise<any> {
    const result = await this.tenantPrisma.queryRaw<any[]>(
      `SELECT preferences FROM {schema}.notification_preferences WHERE user_id = $1`,
      [userId]
    );

    if (result && result.length > 0) {
      return result[0].preferences || {};
    }

    // Return default preferences
    return {
      email_enabled: true,
      sms_enabled: false,
      push_enabled: true,
      in_app_enabled: true,
      notify_job_status: true,
      notify_invoice: true,
      notify_service_call: true,
      notify_quotation: true,
      notify_low_stock: true,
    };
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    tenantId: string,
    userId: string,
    preferences: NotificationPreferencesDto,
  ) {
    // Check if preferences exist
    const existing = await this.tenantPrisma.queryRaw<any[]>(
      `SELECT id FROM {schema}.notification_preferences WHERE user_id = $1`,
      [userId]
    );

    if (existing && existing.length > 0) {
      // Update existing
      await this.tenantPrisma.queryRaw(
        `UPDATE {schema}.notification_preferences
         SET preferences = $1, updated_at = NOW()
         WHERE user_id = $2`,
        [preferences, userId]
      );
    } else {
      // Create new
      await this.tenantPrisma.queryRaw(
        `INSERT INTO {schema}.notification_preferences (id, user_id, preferences, created_at, updated_at)
         VALUES (uuid_generate_v4(), $1, $2, NOW(), NOW())`,
        [userId, preferences]
      );
    }

    return preferences;
  }

  /**
   * Send notification via appropriate channel
   * (This is a placeholder - actual implementation would integrate with email/SMS services)
   */
  private async sendNotification(tenantId: string, notification: any) {
    try {
      switch (notification.type) {
        case NotificationType.EMAIL:
          await this.sendEmailNotification(notification);
          break;
        case NotificationType.SMS:
          await this.sendSMSNotification(notification);
          break;
        case NotificationType.PUSH:
          await this.sendPushNotification(notification);
          break;
        case NotificationType.IN_APP:
          // In-app notifications are already stored in database
          this.logger.log(`In-app notification created for user ${notification.user_id}`);
          break;
      }

      // Update sent_at timestamp
      await this.tenantPrisma.update(tenantId, 'Notification', {
        where: { id: notification.id },
        data: { sent_at: new Date() },
      });

      this.logger.log(`Notification ${notification.id} sent via ${notification.type}`);
    } catch (error) {
      this.logger.error(`Failed to send notification ${notification.id}:`, error);
      throw error;
    }
  }

  /**
   * Send email notification
   * TODO: Integrate with SendGrid, AWS SES, or similar email service
   */
  private async sendEmailNotification(notification: any) {
    // Placeholder for email sending logic
    this.logger.log(
      `[EMAIL] To: ${notification.user_id}, Subject: ${notification.title}, Body: ${notification.message}`
    );
    // Implementation would use email service provider here
  }

  /**
   * Send SMS notification
   * TODO: Integrate with Twilio, AWS SNS, or similar SMS service
   */
  private async sendSMSNotification(notification: any) {
    // Placeholder for SMS sending logic
    this.logger.log(
      `[SMS] To: ${notification.user_id}, Message: ${notification.message}`
    );
    // Implementation would use SMS service provider here
  }

  /**
   * Send push notification
   * TODO: Integrate with Firebase Cloud Messaging, APNs, or similar push service
   */
  private async sendPushNotification(notification: any) {
    // Placeholder for push notification logic
    this.logger.log(
      `[PUSH] To: ${notification.user_id}, Title: ${notification.title}, Body: ${notification.message}`
    );
    // Implementation would use push notification service here
  }

  /**
   * Helper method to check if notification type is enabled
   */
  private isNotificationEnabled(preferences: any, type: NotificationType): boolean {
    switch (type) {
      case NotificationType.EMAIL:
        return preferences.email_enabled !== false;
      case NotificationType.SMS:
        return preferences.sms_enabled === true;
      case NotificationType.PUSH:
        return preferences.push_enabled !== false;
      case NotificationType.IN_APP:
        return preferences.in_app_enabled !== false;
      default:
        return true;
    }
  }

  /**
   * Helper method to send notifications for specific events
   */
  async sendJobStatusNotification(
    tenantId: string,
    userId: string,
    jobId: string,
    oldStatus: string,
    newStatus: string,
  ) {
    return this.create(tenantId, {
      user_id: userId,
      type: NotificationType.IN_APP,
      title: 'Job Status Updated',
      message: `Job status changed from ${oldStatus} to ${newStatus}`,
      priority: NotificationPriority.MEDIUM,
      entity_type: 'Job',
      entity_id: jobId,
      action_url: `/jobs/${jobId}`,
    });
  }

  async sendInvoicePaidNotification(
    tenantId: string,
    userId: string,
    invoiceId: string,
    amount: number,
  ) {
    return this.create(tenantId, {
      user_id: userId,
      type: NotificationType.EMAIL,
      title: 'Invoice Payment Received',
      message: `Payment of $${amount.toFixed(2)} received for invoice`,
      priority: NotificationPriority.HIGH,
      entity_type: 'Invoice',
      entity_id: invoiceId,
      action_url: `/invoices/${invoiceId}`,
    });
  }

  async sendLowStockNotification(
    tenantId: string,
    userId: string,
    materialName: string,
    currentStock: number,
  ) {
    return this.create(tenantId, {
      user_id: userId,
      type: NotificationType.IN_APP,
      title: 'Low Stock Alert',
      message: `${materialName} is running low (${currentStock} remaining)`,
      priority: NotificationPriority.MEDIUM,
      entity_type: 'Material',
      action_url: `/materials`,
    });
  }
}
