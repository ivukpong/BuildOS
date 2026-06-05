import {
    Controller, Get, Post, Put, Patch, Delete,
    Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AdminExtrasService } from './admin-extras.service';
import { Roles, Public } from '../auth/decorators';
import { RolesGuard } from '../auth/roles.guard';

@Controller('admin')
@UseGuards(RolesGuard)
export class AdminExtrasController {
    constructor(private readonly svc: AdminExtrasService) { }

    // ── Approvals ──
    @Get('approvals')
    @Roles('admin', 'approver')
    getApprovals(@Query('module') module?: string) { return this.svc.findApprovals(module); }

    @Patch('approvals/:id')
    @Roles('admin', 'approver')
    updateApproval(@Param('id') id: string, @Body() body: any) { return this.svc.updateApproval(id, body); }

    @Get('reference-data')
    @Roles('admin')
    getReferenceData() { return this.svc.referenceData(); }

    @Get('system-summary')
    @Roles('admin')
    getSystemSummary() { return this.svc.systemSummary(); }

    @Get('activity-log')
    @Roles('admin')
    getActivityLog() { return this.svc.activityLog(); }

    @Get('audit-logs')
    @Roles('admin', 'compliance-officer')
    getAuditLogs(@Query('limit') limit?: number, @Query('offset') offset?: number) { 
        return this.svc.getAuditLogs(limit, offset); 
    }

    // ── Users ──
    @Post('users/invite')
    @Roles('admin')
    inviteUser(@Body() body: { email: string; name: string; role?: string; assignedApps?: string[]; department?: string }) { return this.svc.inviteUser(body); }
    
    @Post('users/:id/resend-invite')
    @Roles('admin')
    resendInvite(@Param('id') id: string) { return this.svc.resendInvite(id); }
    
    @Get('users')
    @Roles('admin')
    getAllUsers(@Query('search') search?: string) { return this.svc.findAllUsers(search); }
    
    @Get('users/:id')
    @Roles('admin')
    getUser(@Param('id') id: string) { return this.svc.findUser(id); }
    
    @Post('users')
    @Roles('admin')
    createUser(@Body() body: any) { return this.svc.createUser(body); }
    
    @Put('users/:id')
    @Roles('admin')
    updateUser(@Param('id') id: string, @Body() body: any) { return this.svc.updateUser(id, body); }
    
    @Delete('users/:id')
    @Roles('admin')
    deleteUser(@Param('id') id: string) { return this.svc.deleteUser(id); }

    // ── App Roles ──
    @Get('roles')
    @Roles('admin')
    getAllRoles() { return this.svc.findAllRoles(); }
    
    @Get('roles/:id')
    @Roles('admin')
    getRole(@Param('id') id: string) { return this.svc.findRole(id); }
    
    @Post('roles')
    @Roles('admin')
    createRole(@Body() body: any) { return this.svc.createRole(body); }
    
    @Put('roles/:id')
    @Roles('admin')
    updateRole(@Param('id') id: string, @Body() body: any) { return this.svc.updateRole(id, body); }
    
    @Delete('roles/:id')
    @Roles('admin')
    deleteRole(@Param('id') id: string) { return this.svc.deleteRole(id); }

    // ── Issue Types ──
    @Get('issue-types')
    @Roles('admin')
    getIssueTypes() { return this.svc.findAllIssueTypes(); }
    
    @Post('issue-types')
    @Roles('admin')
    createIssueType(@Body() body: any) { return this.svc.createIssueType(body); }
    
    @Put('issue-types/:id')
    @Roles('admin')
    updateIssueType(@Param('id') id: string, @Body() body: any) { return this.svc.updateIssueType(id, body); }
    
    @Delete('issue-types/:id')
    @Roles('admin')
    deleteIssueType(@Param('id') id: string) { return this.svc.deleteIssueType(id); }

    // ── Change Categories ──
    @Get('change-categories')
    @Roles('admin')
    getChangeCategories() { return this.svc.findAllChangeCategories(); }
    
    @Post('change-categories')
    @Roles('admin')
    createChangeCategory(@Body() body: any) { return this.svc.createChangeCategory(body); }
    
    @Put('change-categories/:id')
    @Roles('admin')
    updateChangeCategory(@Param('id') id: string, @Body() body: any) { return this.svc.updateChangeCategory(id, body); }
    
    @Delete('change-categories/:id')
    @Roles('admin')
    deleteChangeCategory(@Param('id') id: string) { return this.svc.deleteChangeCategory(id); }

    // ── Process Catalog ──
    @Get('process-catalog')
    @Roles('admin')
    getProcessCatalog() { return this.svc.findProcessCatalog(); }
    
    @Post('process-catalog')
    @Roles('admin')
    createProcessCatalogItem(@Body() body: any) { return this.svc.createProcessCatalogItem(body); }
    
    @Patch('process-catalog/:id')
    @Roles('admin')
    updateProcessCatalogItem(@Param('id') id: string, @Body() body: any) { return this.svc.updateProcessCatalogItem(id, body); }
    
    @Delete('process-catalog/:id')
    @Roles('admin')
    deleteProcessCatalogItem(@Param('id') id: string) { return this.svc.deleteProcessCatalogItem(id); }

    // ── Process Workflows ──
    @Get('process-workflows')
    @Roles('admin')
    getProcessWorkflows() { return this.svc.findProcessWorkflows(); }
    
    @Post('process-workflows')
    @Roles('admin')
    createProcessWorkflow(@Body() body: any) { return this.svc.createProcessWorkflow(body); }
    
    @Patch('process-workflows/:id')
    @Roles('admin')
    updateProcessWorkflow(@Param('id') id: string, @Body() body: any) { return this.svc.updateProcessWorkflow(id, body); }
    
    @Delete('process-workflows/:id')
    @Roles('admin')
    deleteProcessWorkflow(@Param('id') id: string) { return this.svc.deleteProcessWorkflow(id); }

    // ── Company Profile ──
    @Get('company-profile')
    @Roles('admin')
    getCompanyProfile() { return this.svc.getCompanyProfile(); }
    
    @Put('company-profile')
    @Roles('admin')
    updateCompanyProfile(@Body() body: any) { return this.svc.updateCompanyProfile(body); }

    // ── Directors ──
    @Get('directors')
    @Roles('admin')
    getAllDirectors() { return this.svc.findAllDirectors(); }
    
    @Post('directors')
    @Roles('admin')
    createDirector(@Body() body: any) { return this.svc.createDirector(body); }
    
    @Put('directors/:id')
    @Roles('admin')
    updateDirector(@Param('id') id: string, @Body() body: any) { return this.svc.updateDirector(id, body); }
    
    @Delete('directors/:id')
    @Roles('admin')
    deleteDirector(@Param('id') id: string) { return this.svc.deleteDirector(id); }

    // ── Email Config ──
    @Get('email-config')
    @Roles('admin')
    getEmailConfigs() { return this.svc.findEmailConfigs(); }
    
    @Post('email-config')
    @Roles('admin')
    createEmailConfig(@Body() body: any) { return this.svc.createEmailConfig(body); }
    
    @Patch('email-config/:id')
    @Roles('admin')
    updateEmailConfig(@Param('id') id: string, @Body() body: any) { return this.svc.updateEmailConfig(id, body); }
    
    @Delete('email-config/:id')
    @Roles('admin')
    deleteEmailConfig(@Param('id') id: string) { return this.svc.deleteEmailConfig(id); }

    // ── Units of Measurement ──
    @Get('units')
    @Roles('admin')
    getUnits() { return this.svc.findUnits(); }
    
    @Post('units')
    @Roles('admin')
    createUnit(@Body() body: any) { return this.svc.createUnit(body); }
    
    @Patch('units/:id')
    @Roles('admin')
    updateUnit(@Param('id') id: string, @Body() body: any) { return this.svc.updateUnit(id, body); }
    
    @Delete('units/:id')
    @Roles('admin')
    deleteUnit(@Param('id') id: string) { return this.svc.deleteUnit(id); }

    // ── API Keys ──
    @Get('api-keys')
    @Roles('admin')
    getApiKeys() { return this.svc.findApiKeys(); }

    // ── Webhooks ──
    @Get('webhooks')
    @Roles('admin')
    getWebhooks() { return this.svc.findWebhooks(); }

    // ── Email Templates ──
    @Get('email-templates')
    getEmailTemplates() { return this.svc.findEmailTemplates(); }

    // ── Notification Rules ──
    @Get('notification-rules')
    getNotificationRules() { return this.svc.findNotificationRules(); }

    // ── Report Schedules ──
    @Get('report-schedules')
    getReportSchedules() { return this.svc.findReportSchedules(); }
}
