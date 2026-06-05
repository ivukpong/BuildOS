import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async logAction(
    userId: string | null,
    entity: string,
    entityId: string | null,
    action: string,
    description?: string,
    oldValue?: any,
    newValue?: any,
    ipAddress?: string,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: userId || null,
          entity,
          entityId,
          action,
          description,
          oldValue: oldValue ? JSON.stringify(oldValue) : null,
          newValue: newValue ? JSON.stringify(newValue) : null,
          ipAddress,
        },
      });
    } catch (error) {
      // Don't fail the request if audit logging fails
      console.error('Audit logging error:', error);
    }
  }

  async getAuditLog(
    filters?: {
      userId?: string;
      entity?: string;
      action?: string;
      entityId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit = 100,
    skip = 0,
  ) {
    const where: any = {};

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.entity) where.entity = filters.entity;
    if (filters?.action) where.action = filters.action;
    if (filters?.entityId) where.entityId = filters.entityId;

    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total, limit, skip };
  }

  async deleteOldLogs(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return result;
  }
}
