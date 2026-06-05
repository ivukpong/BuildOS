import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios, { AxiosError } from 'axios';
import { createHmac } from 'crypto';

@Injectable()
export class WebhookService {
  constructor(private prisma: PrismaService) {}

  /**
   * Register webhook endpoint
   */
  async registerWebhook(data: any) {
    // Validate URL
    try {
      new URL(data.url);
    } catch {
      throw new BadRequestException('Invalid webhook URL');
    }

    return this.prisma.webhook.create({
      data: {
        url: data.url,
        event: data.event || '*', // * for all events
        isActive: data.isActive ?? true,
        headers: data.headers ? JSON.stringify(data.headers) : null,
        secret: this.generateSecret(),
        maxRetries: data.maxRetries ?? 5,
      },
    });
  }

  /**
   * Get all webhooks
   */
  async getWebhooks(isActive?: boolean) {
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.webhook.findMany({
      where,
      include: { deliveries: false },
    });
  }

  /**
   * Update webhook
   */
  async updateWebhook(id: string, data: any) {
    const updateData: any = {};
    if (data.url) updateData.url = data.url;
    if (data.event) updateData.event = data.event;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.headers) updateData.headers = JSON.stringify(data.headers);
    if (data.maxRetries) updateData.maxRetries = data.maxRetries;

    return this.prisma.webhook.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(id: string) {
    return this.prisma.webhook.delete({ where: { id } });
  }

  /**
   * Trigger webhook for event
   */
  async triggerWebhook(event: string, data: any) {
    const webhooks = await this.prisma.webhook.findMany({
      where: { isActive: true },
    });

    const triggeredWebhooks: any[] = [];

    for (const webhook of webhooks) {
      // Check if webhook should be triggered for this event
      if (webhook.event === '*' || webhook.event === event) {
        try {
          await this.sendWebhookRequest(webhook, event, data);
          triggeredWebhooks.push({
            webhookId: webhook.id,
            status: 'sent',
          });
        } catch (error: any) {
          // Increment retry count
          const retryCount = (webhook.retryCount || 0) + 1;
          await this.prisma.webhook.update({
            where: { id: webhook.id },
            data: {
              retryCount,
              lastError: error.message,
              // Disable after maxRetries failures
              isActive: retryCount < webhook.maxRetries,
            },
          });


          triggeredWebhooks.push({
            webhookId: webhook.id,
            status: 'failed',
            error: error.message,
          });
        }
      }
    }

    return triggeredWebhooks;
  }

  /**
   * Get webhook delivery history
   */
  async getWebhookHistory(webhookId: string, limit = 50) {
    return this.prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Retry failed webhook delivery
   */
  async retryWebhookDelivery(deliveryId: string) {
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { webhook: true },
    });

    if (!delivery) {
      throw new BadRequestException('Delivery not found');
    }

    const payload = JSON.parse(delivery.payload as string);
    try {
      await this.sendWebhookRequest(delivery.webhook, delivery.event, payload);

      return this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: { status: 'delivered', attemptCount: delivery.attemptCount + 1 },
      });
    } catch (error: any) {
      return this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: { status: 'failed', error: error.message, attemptCount: delivery.attemptCount + 1 },
      });
    }
  }

  /**
   * Integration with external HR systems
   */
  async syncWithExternalHR(systemType: string, data: any) {
    switch (systemType) {
      case 'payroll':
        return this.syncToPayrollSystem(data);
      case 'accounting':
        return this.syncToAccountingSystem(data);
      case 'hr':
        return this.syncToHRSystem(data);
      default:
        throw new BadRequestException(`Unknown system type: ${systemType}`);
    }
  }

  /**
   * Integration with external accounting systems
   */
  async syncToAccountingSystem(data: any) {
    // Placeholder for accounting system sync
    console.log('[ACCOUNTING SYNC]', data);
    return {
      status: 'synced',
      system: 'accounting',
      message: 'Data sent to accounting system',
    };
  }

  /**
   * Integration with external payroll systems
   */
  async syncToPayrollSystem(data: any) {
    // Placeholder for payroll system sync
    console.log('[PAYROLL SYNC]', data);
    return {
      status: 'synced',
      system: 'payroll',
      message: 'Data sent to payroll system',
    };
  }

  /**
   * Integration with external HR systems
   */
  async syncToHRSystem(data: any) {
    // Placeholder for HR system sync
    console.log('[HR SYNC]', data);
    return {
      status: 'synced',
      system: 'hr',
      message: 'Data sent to HR system',
    };
  }

  /**
   * Test webhook connectivity
   */
  async testWebhook(webhookId: string) {
    const webhook = await this.prisma.webhook.findUnique({ where: { id: webhookId } });

    if (!webhook) {
      throw new BadRequestException('Webhook not found');
    }

    const testPayload = {
      event: 'test',
      timestamp: new Date(),
      data: { message: 'This is a test webhook' },
    };

    try {
      await this.sendWebhookRequest(webhook, 'test', testPayload.data);
      return { success: true, message: 'Webhook test successful' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ── Helper Methods ──

  private async sendWebhookRequest(webhook: any, event: string, data: any) {
    const headers = webhook.headers ? JSON.parse(webhook.headers as string) : {};
    headers['Content-Type'] = 'application/json';
    headers['X-Webhook-Event'] = event;
    headers['X-Webhook-Secret'] = webhook.secret;
    headers['X-Webhook-Timestamp'] = new Date().toISOString();

    const payload = {
      event,
      timestamp: new Date(),
      data,
    };

    try {
      const response = await axios.post(webhook.url, payload, {
        headers,
        timeout: 10000, // 10 second timeout
      });

      // Log successful delivery
      await this.prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          payload: JSON.stringify(payload),
          status: 'delivered',
          responseCode: response.status,
          responseBody: JSON.stringify(response.data),
          attemptCount: 1,
        },
      });

      // Reset retry count on success
      if (webhook.retryCount > 0) {
        await this.prisma.webhook.update({
          where: { id: webhook.id },
          data: { retryCount: 0, isActive: true },
        });
      }
    } catch (error: any) {
      const axiosError = error as AxiosError;

      // Log failed delivery
      await this.prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          payload: JSON.stringify(payload),
          status: 'failed',
          responseCode: axiosError.response?.status || 0,
          error: axiosError.message,
          attemptCount: 1,
        },
      });

      throw error;
    }
  }

  private generateSecret(): string {
    return createHmac('sha256', 'webhook-secret-key')
      .update(Math.random().toString())
      .digest('hex');
  }
}
