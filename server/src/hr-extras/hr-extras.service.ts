import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HrExtrasService {
    constructor(private prisma: PrismaService) { }

    // ── Attendance ──
    findAllAttendance(employeeId?: string, date?: string) {
        return this.prisma.attendanceRecord.findMany({
            where: {
                ...(employeeId ? { employeeId } : {}),
                ...(date ? { date } : {}),
            },
            orderBy: { date: 'desc' },
        });
    }
    findAttendance(id: string) {
        return this.prisma.attendanceRecord.findUniqueOrThrow({ where: { id } });
    }
    createAttendance(data: any) {
        return this.prisma.attendanceRecord.create({ data });
    }
    updateAttendance(id: string, data: any) {
        return this.prisma.attendanceRecord.update({ where: { id }, data });
    }
    deleteAttendance(id: string) {
        return this.prisma.attendanceRecord.delete({ where: { id } });
    }

    // ── Payroll Periods ──
    findAllPeriods() {
        return this.prisma.payrollPeriod.findMany({ orderBy: { startDate: 'desc' } });
    }
    findPeriod(id: string) {
        return this.prisma.payrollPeriod.findUniqueOrThrow({
            where: { id },
            include: { payrollRuns: true },
        });
    }
    createPeriod(data: any) {
        return this.prisma.payrollPeriod.create({ data });
    }
    updatePeriod(id: string, data: any) {
        return this.prisma.payrollPeriod.update({ where: { id }, data });
    }
    deletePeriod(id: string) {
        return this.prisma.payrollPeriod.delete({ where: { id } });
    }

    // ── Payroll Runs ──
    findAllRuns(periodId?: string) {
        return this.prisma.payrollRun.findMany({
            where: periodId ? { periodId } : {},
            include: { entries: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    findRun(id: string) {
        return this.prisma.payrollRun.findUniqueOrThrow({
            where: { id },
            include: { entries: true },
        });
    }
    createRun(data: any) {
        return this.prisma.payrollRun.create({ data });
    }
    updateRun(id: string, data: any) {
        return this.prisma.payrollRun.update({ where: { id }, data });
    }

    // ── Payroll Entries ──
    findEntriesByRun(runId: string) {
        return this.prisma.payrollEntry.findMany({ where: { runId } });
    }
    async departmentPayrollSummary() {
        const latest = await this.prisma.payrollRun.findFirst({
            orderBy: { createdAt: 'desc' },
            include: { entries: true },
        });
        if (!latest) return [];
        const map = new Map<string, { department: string; employees: number; grossPay: number; netPay: number }>();
        latest.entries.forEach((entry) => {
            const department = entry.department || 'Unassigned';
            const current = map.get(department) ?? { department, employees: 0, grossPay: 0, netPay: 0 };
            current.employees += 1;
            current.grossPay += entry.grossPay;
            current.netPay += entry.netPay;
            map.set(department, current);
        });
        return Array.from(map.values());
    }
    updateEntry(id: string, data: any) {
        return this.prisma.payrollEntry.update({ where: { id }, data });
    }

    // ── Payslips ──
    findAllPayslips(employeeId?: string) {
        return this.prisma.payslip.findMany({
            where: employeeId ? { employeeId } : {},
            orderBy: { issuedAt: 'desc' },
        });
    }
    findPayslip(id: string) {
        return this.prisma.payslip.findUniqueOrThrow({ where: { id } });
    }
    createPayslip(data: any) {
        return this.prisma.payslip.create({ data });
    }
    updatePayslip(id: string, data: any) {
        return this.prisma.payslip.update({ where: { id }, data });
    }

    // ── Appraisals ──
    findAllAppraisals(employeeId?: string) {
        return this.prisma.appraisal.findMany({
            where: employeeId ? { employeeId } : {},
            orderBy: { reviewDate: 'desc' },
        });
    }
    findAppraisal(id: string) {
        return this.prisma.appraisal.findUniqueOrThrow({ where: { id } });
    }
    createAppraisal(data: any) {
        return this.prisma.appraisal.create({ data });
    }
    updateAppraisal(id: string, data: any) {
        return this.prisma.appraisal.update({ where: { id }, data });
    }
    deleteAppraisal(id: string) {
        return this.prisma.appraisal.delete({ where: { id } });
    }

    // ── Issues ──
    findAllIssues(status?: string, projectId?: string) {
        return this.prisma.issue.findMany({
            where: {
                ...(status ? { status } : {}),
                ...(projectId ? { projectId } : {}),
            },
            orderBy: { reportedAt: 'desc' },
        });
    }
    findIssue(id: string) {
        return this.prisma.issue.findUniqueOrThrow({ where: { id } });
    }
    createIssue(data: any) {
        return this.prisma.issue.create({ data });
    }
    updateIssue(id: string, data: any) {
        return this.prisma.issue.update({ where: { id }, data });
    }
    deleteIssue(id: string) {
        return this.prisma.issue.delete({ where: { id } });
    }
}
