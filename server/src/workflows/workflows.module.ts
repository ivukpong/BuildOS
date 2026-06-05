import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowEngineService } from './workflow-engine.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WorkflowController],
  providers: [WorkflowEngineService],
  exports: [WorkflowEngineService],
})
export class WorkflowsModule {}
