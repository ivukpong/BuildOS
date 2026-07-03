import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  /**
   * The UI sends DateTime fields as date-only strings (e.g. "2026-07-10")
   * which Prisma rejects. Coerce them to Date objects; full ISO strings and
   * Date instances pass through unchanged, invalid values become undefined.
   */
  private normalizeDates(dto: any): any {
    const out = { ...dto };
    for (const field of ['dueDate', 'startDate', 'completedAt']) {
      if (out[field] === undefined) continue;
      if (out[field] === null || out[field] === '') {
        out[field] = null;
        continue;
      }
      const d = out[field] instanceof Date ? out[field] : new Date(out[field]);
      out[field] = Number.isNaN(d.getTime()) ? undefined : d;
    }
    return out;
  }

  async create(createTaskDto: any) {
    // Validate dependencies exist
    if (createTaskDto.dependencies && createTaskDto.dependencies.length > 0) {
      for (const depId of createTaskDto.dependencies) {
        const depTask = await this.prisma.task.findUnique({
          where: { id: depId },
        });
        if (!depTask) {
          throw new BadRequestException(
            `Dependency task ${depId} does not exist`,
          );
        }
      }
    }

    return this.prisma.task.create({
      data: this.normalizeDates(createTaskDto),
    });
  }

  async findAll(
    status?: string,
    projectId?: string,
    assignedTo?: string,
    limit = 50,
    skip = 0,
  ) {
    const where: any = {};
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;
    if (assignedTo) where.assignedTo = assignedTo;

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.task.count({ where }),
    ]);

    return { data: tasks, total, limit, skip };
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return task;
  }

  async update(id: string, updateTaskDto: any) {
    // Verify task exists
    await this.findOne(id);

    // Validate dependencies don't create circular references
    if (updateTaskDto.dependencies) {
      if (updateTaskDto.dependencies.includes(id)) {
        throw new BadRequestException(
          'A task cannot depend on itself',
        );
      }

      for (const depId of updateTaskDto.dependencies) {
        const depTask = await this.prisma.task.findUnique({
          where: { id: depId },
        });
        if (!depTask) {
          throw new BadRequestException(
            `Dependency task ${depId} does not exist`,
          );
        }
      }
    }

    return this.prisma.task.update({
      where: { id },
      data: this.normalizeDates(updateTaskDto),
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.task.delete({ where: { id } });
  }

  async getTasksByProject(projectId: string) {
    return this.prisma.task.findMany({
      where: { projectId },
      orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
    });
  }

  async getTasksByAssignee(assigneeId: string) {
    return this.prisma.task.findMany({
      where: { assignedTo: assigneeId },
      orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
    });
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);

    const validStatuses = ['todo', 'in_progress', 'done', 'blocked', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    const updateData: any = { status };

    if (status === 'done') {
      updateData.completedAt = new Date();
    }

    return this.prisma.task.update({
      where: { id },
      data: updateData,
    });
  }

  async getOverdueTasks() {
    return this.prisma.task.findMany({
      where: {
        status: { not: 'done' },
        dueDate: {
          lt: new Date(),
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}
