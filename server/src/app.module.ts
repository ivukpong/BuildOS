import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { EmployeesModule } from './employees/employees.module';
import { DepartmentsModule } from './departments/departments.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { LeaveTypesModule } from './leave-types/leave-types.module';
import { ClaimTypesModule } from './claim-types/claim-types.module';
import { LeaveRequestsModule } from './leave-requests/leave-requests.module';
import { ClaimsModule } from './claims/claims.module';
import { ExpensesModule } from './expenses/expenses.module';
import { IncomeModule } from './income/income.module';
import { BudgetsModule } from './budgets/budgets.module';
import { PaymentsModule } from './payments/payments.module';
import { AuthModule } from './auth/auth.module';
import { MaterialsModule } from './materials/materials.module';
import { ProcurementRequestsModule } from './procurement-requests/procurement-requests.module';
import { ConstructionExtrasModule } from './construction-extras/construction-extras.module';
import { HrExtrasModule } from './hr-extras/hr-extras.module';
import { FinanceExtrasModule } from './finance-extras/finance-extras.module';
import { AdminExtrasModule } from './admin-extras/admin-extras.module';
import { HealthModule } from './health/health.module';
import { TasksModule } from './tasks/tasks.module';
import { JobRolesModule } from './job-roles/job-roles.module';
import { WorkforceAllocationModule } from './workforce-allocation/workforce-allocation.module';
import { ActivityHistoryModule } from './activity-history/activity-history.module';
import { ReportsModule } from './reports/reports.module';
import { ResourcePlanningModule } from './resource-planning/resource-planning.module';
import { ComplianceDocumentsModule } from './compliance-documents/compliance-documents.module';
import { AppCatalogModule } from './app-catalog/app-catalog.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { RolesGuard } from './auth/roles.guard';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        AuthModule,
        PrismaModule,
        AuditLogModule,
        NotificationsModule,
        WorkflowsModule,
        IntegrationsModule,
        ProjectsModule,
        EmployeesModule,
        DepartmentsModule,
        HealthModule,
        SuppliersModule,
        PurchaseOrdersModule,
        LeaveTypesModule,
        ClaimTypesModule,
        LeaveRequestsModule,
        ClaimsModule,
        ExpensesModule,
        IncomeModule,
        BudgetsModule,
        PaymentsModule,
        MaterialsModule,
        ProcurementRequestsModule,
        ConstructionExtrasModule,
        HrExtrasModule,
        FinanceExtrasModule,
        AdminExtrasModule,
        TasksModule,
        JobRolesModule,
        WorkforceAllocationModule,
        ActivityHistoryModule,
        ReportsModule,
        ResourcePlanningModule,
        ComplianceDocumentsModule,
        AppCatalogModule,
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ],
    providers: [
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
    ],
})
export class AppModule { }
