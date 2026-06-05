import { Module } from '@nestjs/common';
import { ResourcePlanningController } from './resource-planning.controller';
import { ResourcePlanningService } from './resource-planning.service';
import { ResourceAllocationController } from './resource-allocation.controller';
import { ResourceAllocationService } from './resource-allocation.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ResourcePlanningController, ResourceAllocationController],
    providers: [ResourcePlanningService, ResourceAllocationService],
    exports: [ResourceAllocationService],
})
export class ResourcePlanningModule { }
