import {
    Controller, Get, Post, Put, Patch, Delete,
    Param, Body, Query,
} from '@nestjs/common';
import { AdminExtrasService } from './admin-extras.service';

@Controller()
export class AdminExtrasController {
    constructor(private readonly svc: AdminExtrasService) { }

    @Get('approvals')
    getApprovals(@Query('module') module?: string) { return this.svc.findApprovals(module); }

    @Get('reference-data')
    getReferenceData() { return this.svc.referenceData(); }

    @Get('admin/system-summary')
    getSystemSummary() { return this.svc.systemSummary(); }

    @Get('admin/activity-log')
    getActivityLog() { return this.svc.activityLog(); }

    // ── Users ──
    @Get('users')
    getAllUsers(@Query('search') search?: string) { return this.svc.findAllUsers(search); }
    @Get('users/:id')
    getUser(@Param('id') id: string) { return this.svc.findUser(id); }
    @Post('users')
    createUser(@Body() body: any) { return this.svc.createUser(body); }
    @Put('users/:id')
    updateUser(@Param('id') id: string, @Body() body: any) { return this.svc.updateUser(id, body); }
    @Delete('users/:id')
    deleteUser(@Param('id') id: string) { return this.svc.deleteUser(id); }

    // ── App Roles ──
    @Get('app-roles')
    getAllRoles() { return this.svc.findAllRoles(); }
    @Get('app-roles/:id')
    getRole(@Param('id') id: string) { return this.svc.findRole(id); }
    @Post('app-roles')
    createRole(@Body() body: any) { return this.svc.createRole(body); }
    @Put('app-roles/:id')
    updateRole(@Param('id') id: string, @Body() body: any) { return this.svc.updateRole(id, body); }
    @Delete('app-roles/:id')
    deleteRole(@Param('id') id: string) { return this.svc.deleteRole(id); }
}
