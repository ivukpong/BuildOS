import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResourceAllocationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create resource allocation
   */
  async create(createDto: any) {
    // Validate dates
    if (new Date(createDto.startDate) > new Date(createDto.endDate)) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Check for conflicts
    const conflict = await this.checkConflict(
      createDto.workerId,
      createDto.startDate,
      createDto.endDate,
    );

    if (conflict.hasConflict && createDto.allocationPercent > 80) {
      throw new ConflictException({
        message: 'Resource conflict detected at > 80% allocation',
        conflictingAllocations: conflict.conflicts,
      });
    }

    return this.prisma.resourceAllocation.create({
      data: createDto,
    });
  }

  /**
   * Get all allocations
   */
  async findAll(filters?: { projectId?: string; workerId?: string; status?: string }) {
    const where: any = {};
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.workerId) where.workerId = filters.workerId;
    if (filters?.status) where.status = filters.status;

    return this.prisma.resourceAllocation.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });
  }

  /**
   * Get single allocation
   */
  async findOne(id: string) {
    const allocation = await this.prisma.resourceAllocation.findUnique({
      where: { id },
    });

    if (!allocation) {
      throw new NotFoundException(`Allocation ${id} not found`);
    }

    return allocation;
  }

  /**
   * Update allocation
   */
  async update(id: string, updateDto: any) {
    await this.findOne(id); // Verify exists

    // If dates changed, check for conflicts
    if (updateDto.startDate || updateDto.endDate) {
      const allocation = await this.findOne(id);
      const startDate = updateDto.startDate || allocation.startDate;
      const endDate = updateDto.endDate || allocation.endDate;

      const conflict = await this.checkConflict(
        allocation.workerId,
        startDate,
        endDate,
        id,
      );

      if (conflict.hasConflict && updateDto.allocationPercent) {
        throw new ConflictException({
          message: 'Resource conflict detected',
          conflictingAllocations: conflict.conflicts,
        });
      }
    }

    return this.prisma.resourceAllocation.update({
      where: { id },
      data: updateDto,
    });
  }

  /**
   * Delete allocation
   */
  async delete(id: string) {
    await this.findOne(id);

    return this.prisma.resourceAllocation.delete({
      where: { id },
    });
  }

  /**
   * Check for resource conflicts
   */
  async checkConflict(
    workerId: string,
    startDate: any,
    endDate: any,
    excludeId?: string,
  ) {
    const conflicts = await this.prisma.resourceAllocation.findMany({
      where: {
        workerId,
        id: excludeId ? { not: excludeId } : undefined,
        status: 'active',
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    // Calculate total allocation percent
    let totalPercent = 0;
    for (const conflict of conflicts) {
      totalPercent += conflict.allocationPercent;
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      totalAllocationPercent: totalPercent,
    };
  }

  /**
   * Get resource utilization for a project
   */
  async getProjectUtilization(projectId: string) {
    const allocations = await this.prisma.resourceAllocation.findMany({
      where: { projectId, status: 'active' },
    });

    const totalAllocation = allocations.reduce((sum, a) => sum + a.allocationPercent, 0);
    const averageAllocation = allocations.length > 0 ? totalAllocation / allocations.length : 0;

    return {
      projectId,
      resourceCount: allocations.length,
      totalAllocationPercent: totalAllocation,
      averageAllocationPercent: Math.round(averageAllocation * 100) / 100,
      allocations,
    };
  }

  /**
   * Get resource availability
   */
  async getResourceAvailability(workerId: string, startDate: any, endDate: any) {
    const allocations = await this.prisma.resourceAllocation.findMany({
      where: {
        workerId,
        status: 'active',
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocationPercent, 0);
    const available = Math.max(0, 100 - totalAllocated);

    return {
      workerId,
      totalAllocationPercent: totalAllocated,
      availablePercent: available,
      isAvailable: available > 0,
      period: { startDate, endDate },
    };
  }

  /**
   * Bulk allocate resources
   */
  async bulkAllocate(allocations: any[]) {
    const results = [];

    for (const allocation of allocations) {
      try {
        const result = await this.create(allocation);
        results.push({ success: true, data: result });
      } catch (error: any) {
        results.push({
          success: false,
          error: error.message,
          allocation,
        });
      }
    }

    return results;
  }

  /**
   * Complete allocation
   */
  async completeAllocation(id: string) {
    return this.prisma.resourceAllocation.update({
      where: { id },
      data: { status: 'completed', endDate: new Date() },
    });
  }
}
