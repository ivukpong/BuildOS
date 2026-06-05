import { Module } from '@nestjs/common';
import { AdminExtrasController } from './admin-extras.controller';
import { AdminExtrasService } from './admin-extras.service';
import { SystemConfigController, ReportsController } from './system-config.controller';
import { SystemConfigService } from './system-config.service';
import { ReportBuilderService } from '../reports/report-builder.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AdminExtrasController, SystemConfigController, ReportsController],
    providers: [AdminExtrasService, SystemConfigService, ReportBuilderService],
    exports: [SystemConfigService, ReportBuilderService],
})
export class AdminExtrasModule { }
