import { Module } from '@nestjs/common';
import { ConstructionExtrasController } from './construction-extras.controller';
import { ConstructionExtrasService } from './construction-extras.service';
import { TimelineController } from './timeline.controller';
import { TimelineService } from './timeline.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ConstructionExtrasController, TimelineController],
    providers: [ConstructionExtrasService, TimelineService],
    exports: [TimelineService],
})
export class ConstructionExtrasModule { }
