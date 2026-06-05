import { Module } from '@nestjs/common';
import { LeaveRequestsController } from './leave-requests.controller';
import { LeaveRequestsService } from './leave-requests.service';
import { LeaveBalanceService } from './leave-balance.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [LeaveRequestsController],
    providers: [LeaveRequestsService, LeaveBalanceService],
    exports: [LeaveBalanceService],
})
export class LeaveRequestsModule { }
