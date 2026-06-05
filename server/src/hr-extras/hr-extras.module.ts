import { Module } from '@nestjs/common';
import { HrExtrasController } from './hr-extras.controller';
import { HrExtrasService } from './hr-extras.service';
import { PayrollController } from './payroll.controller';
import { PayrollOrchestrationService } from './payroll-orchestration.service';
import { PayrollValidationService } from './payroll-validation.service';
import { PayrollTaxService } from './payroll-tax.service';
import { PayrollDeductionsService } from './payroll-deductions.service';
import { PayslipGenerationService } from './payslip-generation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LeaveRequestsModule } from '../leave-requests/leave-requests.module';

@Module({
    imports: [PrismaModule, LeaveRequestsModule],
    controllers: [HrExtrasController, PayrollController],
    providers: [
        HrExtrasService,
        PayrollOrchestrationService,
        PayrollValidationService,
        PayrollTaxService,
        PayrollDeductionsService,
        PayslipGenerationService,
    ],
    exports: [
        PayrollOrchestrationService,
        PayrollValidationService,
        PayrollTaxService,
        PayrollDeductionsService,
        PayslipGenerationService,
    ],
})
export class HrExtrasModule { }
