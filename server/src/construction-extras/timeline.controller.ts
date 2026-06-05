import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators';
import { RolesGuard } from '../auth/roles.guard';
import { TimelineService } from './timeline.service';

@Controller('timelines')
@UseGuards(RolesGuard)
export class TimelineController {
  constructor(private timelineService: TimelineService) {}

  // ── Timeline CRUD ──
  @Post()
  @Roles('admin', 'project-manager')
  async create(@Body() createDto: any) {
    const timeline = await this.timelineService.createTimeline(createDto);
    return { success: true, data: timeline, message: 'Timeline created' };
  }

  @Get(':id')
  @Roles('admin', 'project-manager', 'team-lead')
  async getOne(@Param('id') id: string) {
    const timeline = await this.timelineService.getTimeline(id);
    return { success: true, data: timeline };
  }

  @Get('project/:projectId')
  @Roles('admin', 'project-manager', 'team-lead')
  async getProjectTimelines(@Param('projectId') projectId: string) {
    const timelines = await this.timelineService.getProjectTimelines(projectId);
    return { success: true, data: timelines };
  }

  @Put(':id')
  @Roles('admin', 'project-manager')
  async update(@Param('id') id: string, @Body() updateDto: any) {
    const timeline = await this.timelineService.updateTimeline(id, updateDto);
    return { success: true, data: timeline, message: 'Timeline updated' };
  }

  @Delete(':id')
  @Roles('admin', 'project-manager')
  async delete(@Param('id') id: string) {
    await this.timelineService.deleteTimeline(id);
    return { success: true, message: 'Timeline deleted' };
  }

  // ── Phase Management ──
  @Post(':timelineId/phases')
  @Roles('admin', 'project-manager')
  async addPhase(@Param('timelineId') timelineId: string, @Body() phaseDto: any) {
    const timeline = await this.timelineService.addPhase(timelineId, phaseDto);
    return { success: true, data: timeline, message: 'Phase added' };
  }

  @Put(':timelineId/phases/:phaseId')
  @Roles('admin', 'project-manager')
  async updatePhase(
    @Param('timelineId') timelineId: string,
    @Param('phaseId') phaseId: string,
    @Body() updateDto: any,
  ) {
    const timeline = await this.timelineService.updatePhase(timelineId, phaseId, updateDto);
    return { success: true, data: timeline, message: 'Phase updated' };
  }

  @Delete(':timelineId/phases/:phaseId')
  @Roles('admin', 'project-manager')
  async removePhase(
    @Param('timelineId') timelineId: string,
    @Param('phaseId') phaseId: string,
  ) {
    const timeline = await this.timelineService.removePhase(timelineId, phaseId);
    return { success: true, data: timeline, message: 'Phase removed' };
  }

  // ── Progress & Status ──
  @Get(':id/progress')
  @Roles('admin', 'project-manager', 'team-lead')
  async getProgress(@Param('id') id: string) {
    const progress = await this.timelineService.getTimelineProgress(id);
    return { success: true, data: progress };
  }

  @Get('project/:projectId/milestones')
  @Roles('admin', 'project-manager', 'team-lead')
  async getMilestones(@Param('projectId') projectId: string) {
    const milestones = await this.timelineService.getMilestones(projectId);
    return { success: true, data: milestones };
  }
}
