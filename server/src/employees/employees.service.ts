import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Columns accepted from clients; everything else is dropped. */
const EMPLOYEE_FIELDS = [
    'firstName', 'lastName', 'middleName', 'email', 'phone', 'dateOfBirth',
    'gender', 'dateHired', 'status', 'employmentType', 'projectCount', 'projects',
    'baseSalary', 'gradeLevel', 'jobRoleId', 'bankName', 'accountNumber',
    'accountHolder', 'supervisorId', 'taxId', 'pensionId', 'healthInsuranceId',
    'emergencyContact', 'emergencyPhone', 'address', 'city', 'state', 'zipCode',
    'departmentId',
] as const;

const DATE_FIELDS = new Set(['dateOfBirth', 'dateHired']);

function sanitizeEmployeeInput(data: any): Record<string, any> {
    const out: Record<string, any> = {};
    for (const key of EMPLOYEE_FIELDS) {
        if (data?.[key] === undefined) continue;
        out[key] = DATE_FIELDS.has(key) && data[key]
            ? new Date(data[key])
            : data[key];
    }
    return out;
}

@Injectable()
export class EmployeesService {
    constructor(private prisma: PrismaService) { }

    findAll(status?: string, departmentId?: string) {
        return this.prisma.employee.findMany({
            where: {
                ...(status ? { status: status as any } : {}),
                ...(departmentId ? { departmentId } : {}),
            },
            include: { department: true },
            orderBy: { firstName: 'asc' },
        });
    }

    findOne(id: string) {
        return this.prisma.employee.findUniqueOrThrow({
            where: { id },
            include: { department: true },
        });
    }

    create(data: any) {
        const clean = sanitizeEmployeeInput(data);
        // Required columns without Prisma defaults.
        clean.phone = clean.phone ?? '';
        clean.dateHired = clean.dateHired ?? new Date();
        return this.prisma.employee.create({ data: clean as any, include: { department: true } });
    }

    update(id: string, data: any) {
        const clean = sanitizeEmployeeInput(data);
        return this.prisma.employee.update({ where: { id }, data: clean as any, include: { department: true } });
    }

    remove(id: string) {
        return this.prisma.employee.delete({ where: { id } });
    }
}
