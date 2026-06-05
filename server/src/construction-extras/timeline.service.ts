import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TimelineService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create project timeline
   */
  async createTimeline(createDto: any) {
    // Validate phases if provided
    if (createDto.phases && Array.isArray(createDto.phases)) {
      this.validatePhases(createDto.phases);
    }

    return this.prisma.timeline.create({
      data: {
        name: createDto.name,
        projectId: createDto.projectId,
        projectName: createDto.projectName,
        status: createDto.status || 'On Track',
        startDate: new Date(createDto.startDate),
        endDate: new Date(createDto.endDate),
        phases: JSON.stringify(createDto.phases || []),
      },
    });
  }

  /**
   * Get timeline by ID
   */
  async getTimeline(id: string) {
    const timeline = await this.prisma.timeline.findUnique({ where: { id } });

    if (!timeline) {
      throw new NotFoundException(`Timeline ${id} not found`);
    }

    return {
      ...timeline,
      phases: JSON.parse(timeline.phases as string),
    };
  }

  /**
   * Get all timelines for a project
   */
  async getProjectTimelines(projectId: string) {
    const timelines = await this.prisma.timeline.findMany({
      where: { projectId },
    });

    return timelines.map((t) => ({
      ...t,
      phases: JSON.parse(t.phases as string),
    }));
  }

  /**
   * Update timeline
   */
  async updateTimeline(id: string, updateDto: any) {
    const timeline = await this.getTimeline(id);

    // Validate new phases if provided
    if (updateDto.phases) {
      this.validatePhases(updateDto.phases);
    }

    return this.prisma.timeline.update({
      where: { id },
      data: {
        name: updateDto.name || timeline.name,
        status: updateDto.status || timeline.status,
        startDate: updateDto.startDate ? new Date(updateDto.startDate) : timeline.startDate,
        endDate: updateDto.endDate ? new Date(updateDto.endDate) : timeline.endDate,
        phases: updateDto.phases ? JSON.stringify(updateDto.phases) : timeline.phases,
      },
    });
  }

  /**
   * Delete timeline
   */
  async deleteTimeline(id: string) {
    await this.getTimeline(id);

    return this.prisma.timeline.delete({ where: { id } });
  }

  /**
   * Add phase to timeline
   */
  async addPhase(timelineId: string, phaseDto: any) {
    const timeline = await this.getTimeline(timelineId);
    const phases = JSON.parse(timeline.phases as string) || [];

    // Validate new phase
    if (!phaseDto.name || !phaseDto.sequence) {
      throw new BadRequestException('Phase must have name and sequence');
    }

    // Check for duplicate sequence
    if (phases.some((p: any) => p.sequence === phaseDto.sequence)) {
      throw new BadRequestException(`Phase with sequence ${phaseDto.sequence} already exists`);
    }

    phases.push({
      id: `phase_${Date.now()}`,
      ...phaseDto,
      status: phaseDto.status || 'planned',
    });

    // Sort by sequence
    phases.sort((a: any, b: any) => a.sequence - b.sequence);

    return this.prisma.timeline.update({
      where: { id: timelineId },
      data: { phases: JSON.stringify(phases) },
    });
  }

  /**
   * Update phase in timeline
   */
  async updatePhase(timelineId: string, phaseId: string, updateDto: any) {
    const timeline = await this.getTimeline(timelineId);
    const phases = JSON.parse(timeline.phases as string) || [];

    const phaseIndex = phases.findIndex((p: any) => p.id === phaseId);
    if (phaseIndex === -1) {
      throw new NotFoundException(`Phase ${phaseId} not found`);
    }

    phases[phaseIndex] = { ...phases[phaseIndex], ...updateDto };

    return this.prisma.timeline.update({
      where: { id: timelineId },
      data: { phases: JSON.stringify(phases) },
    });
  }

  /**
   * Remove phase from timeline
   */
  async removePhase(timelineId: string, phaseId: string) {
    const timeline = await this.getTimeline(timelineId);
    const phases = JSON.parse(timeline.phases as string) || [];

    const filteredPhases = phases.filter((p: any) => p.id !== phaseId);

    if (filteredPhases.length === phases.length) {
      throw new NotFoundException(`Phase ${phaseId} not found`);
    }

    return this.prisma.timeline.update({
      where: { id: timelineId },
      data: { phases: JSON.stringify(filteredPhases) },
    });
  }

  /**
   * Get timeline progress
   */
  async getTimelineProgress(timelineId: string) {
    const timeline = await this.getTimeline(timelineId);
    const phases = JSON.parse(timeline.phases as string) || [];

    const completedPhases = phases.filter((p: any) => p.status === 'completed').length;
    const totalPhases = phases.length;
    const percentComplete = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;

    // Calculate actual vs planned
    const now = new Date();
    const start = new Date(timeline.startDate);
    const end = new Date(timeline.endDate);
    const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const plannedProgress = (elapsedDays / totalDays) * 100;

    const status = this.calculateStatus(percentComplete, plannedProgress);

    return {
      timelineId,
      totalPhases,
      completedPhases,
      percentComplete: Math.round(percentComplete),
      plannedProgress: Math.round(plannedProgress),
      actualProgress: Math.round(percentComplete),
      status,
      isOnTrack: Math.abs(percentComplete - plannedProgress) <= 10,
      phases,
    };
  }

  /**
   * Validate phases array
   */
  private validatePhases(phases: any[]) {
    if (!Array.isArray(phases)) {
      throw new BadRequestException('Phases must be an array');
    }

    const sequences = new Set();
    for (const phase of phases) {
      if (!phase.name || phase.sequence === undefined) {
        throw new BadRequestException('Each phase must have name and sequence');
      }

      if (sequences.has(phase.sequence)) {
        throw new BadRequestException(`Duplicate phase sequence: ${phase.sequence}`);
      }

      sequences.add(phase.sequence);

      if (phase.startDate && phase.endDate) {
        if (new Date(phase.startDate) > new Date(phase.endDate)) {
          throw new BadRequestException(
            `Phase ${phase.name}: Start date must be before end date`,
          );
        }
      }
    }
  }

  /**
   * Calculate timeline status
   */
  private calculateStatus(actualProgress: number, plannedProgress: number): string {
    const variance = actualProgress - plannedProgress;

    if (variance >= -5) return 'On Track';
    if (variance >= -15) return 'At Risk';
    return 'Behind Schedule';
  }

  /**
   * Get milestone information
   */
  async getMilestones(projectId: string) {
    const timelines = await this.getProjectTimelines(projectId);
    const milestones: any[] = [];

    for (const timeline of timelines) {
      const phases = JSON.parse(timeline.phases as string) || [];
      for (const phase of phases) {
        if (phase.isMilestone) {
          milestones.push({
            id: phase.id,
            name: phase.name,
            dueDate: phase.endDate,
            status: phase.status,
            timeline: timeline.name,
          });
        }
      }
    }

    return milestones.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }
}
