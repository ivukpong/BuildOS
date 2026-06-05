import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportBuilderService } from './report-builder.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ReportsController],
    providers: [ReportsService, ReportBuilderService],
    exports: [ReportBuilderService],
})
export class ReportsModule { }
