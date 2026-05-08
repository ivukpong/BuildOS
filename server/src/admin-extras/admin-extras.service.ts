import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminExtrasService {
    constructor(private prisma: PrismaService) { }

    private normalizeStatus(status: string) {
        const s = String(status || '').toLowerCase();
        if (s.includes('reject')) return 'rejected';
        if (s.includes('approve') || s.includes('paid') || s.includes('complete')) return 'approved';
        return 'pending';
    }

    async findApprovals(module?: string) {
        const target = String(module || 'all').toLowerCase();
        const rows: any[] = [];

        if (target === 'all' || target === 'hr' || target === 'ess') {
            const leaveRequests = await this.prisma.leaveRequest.findMany({
                include: { employee: { include: { department: true } }, leaveType: true },
                orderBy: { submittedAt: 'desc' },
            });
            rows.push(...leaveRequests.map((r) => ({
                id: r.id,
                module: target === 'ess' ? 'ess' : 'hr',
                type: 'Leave Request',
                title: `${r.employee.firstName} ${r.employee.lastName} — ${r.leaveType.name}`,
                project: r.employee.department?.name ?? 'HR',
                requestedBy: `${r.employee.firstName} ${r.employee.lastName}`,
                date: r.submittedAt,
                status: this.normalizeStatus(r.status),
                urgency: r.days > 10 ? 'urgent' : 'normal',
                description: r.notes ?? `${r.days} day leave request`,
            })));
        }

        if (target === 'all' || target === 'finance' || target === 'ess') {
            const claims = await this.prisma.claim.findMany({
                include: { employee: { include: { department: true } }, claimType: true },
                orderBy: { createdAt: 'desc' },
            });
            rows.push(...claims.map((c) => ({
                id: c.id,
                module: target === 'ess' ? 'ess' : 'finance',
                type: 'Expense Claim',
                title: c.claimType.name,
                project: c.employee.department?.name ?? 'Finance',
                requestedBy: `${c.employee.firstName} ${c.employee.lastName}`,
                date: c.date,
                amount: c.amount,
                status: this.normalizeStatus(c.status),
                urgency: c.amount >= 1000000 ? 'urgent' : 'normal',
                description: c.description,
            })));
        }

        if (target === 'all' || target === 'finance') {
            const expenses = await this.prisma.expense.findMany({
                include: { project: true },
                orderBy: { createdAt: 'desc' },
            });
            rows.push(...expenses.map((e) => ({
                id: e.id,
                module: 'finance',
                type: 'Expense Claim',
                title: e.category,
                project: e.project?.name ?? 'General',
                requestedBy: e.createdBy,
                date: e.date,
                amount: e.amount,
                status: this.normalizeStatus(e.status),
                urgency: e.amount >= 1000000 ? 'urgent' : 'normal',
                description: e.description,
            })));
        }

        if (target === 'all' || target === 'procurement') {
            const [materialRequests, purchaseRequests, purchaseOrders] = await Promise.all([
                this.prisma.materialRequest.findMany({ orderBy: { createdAt: 'desc' } }),
                this.prisma.purchaseRequest.findMany({ orderBy: { createdAt: 'desc' } }),
                this.prisma.purchaseOrder.findMany({
                    include: { supplier: true },
                    orderBy: { createdAt: 'desc' },
                }),
            ]);
            rows.push(...materialRequests.map((r) => ({
                id: r.id,
                module: 'procurement',
                type: 'Material Request',
                title: `${r.materialName} — ${r.qty} ${r.unit}`,
                project: r.projectName ?? r.storeName,
                requestedBy: r.requestedBy,
                date: r.requestDate,
                status: this.normalizeStatus(r.status),
                urgency: String(r.priority).toLowerCase().includes('urgent') ? 'urgent' : 'normal',
                description: r.purpose ?? r.notes ?? '',
            })));
            rows.push(...purchaseRequests.map((r) => ({
                id: r.id,
                module: 'procurement',
                type: 'Purchase Request',
                title: r.title,
                project: r.projectName ?? 'Procurement',
                requestedBy: r.requestedBy,
                date: r.createdAt,
                status: this.normalizeStatus(r.status),
                urgency: String(r.priority).toLowerCase().includes('urgent') ? 'urgent' : 'normal',
                description: r.notes ?? '',
            })));
            rows.push(...purchaseOrders.map((o) => ({
                id: o.id,
                module: 'procurement',
                type: 'Purchase Order',
                title: `${o.supplier.name} — ${o.prRef ?? o.id}`,
                project: o.mrRef ?? o.prRef ?? 'Procurement',
                requestedBy: o.createdBy,
                date: o.createdDate,
                amount: o.totalValue,
                status: this.normalizeStatus(o.status),
                urgency: 'normal',
                description: `Expected ${o.expectedDate.toISOString().slice(0, 10)}`,
            })));
        }

        if (target === 'all' || target === 'admin') {
            const pendingUsers = await this.prisma.user.findMany({
                where: { status: { contains: 'Pending', mode: 'insensitive' } },
                orderBy: { createdAt: 'desc' },
            });
            rows.push(...pendingUsers.map((u) => ({
                id: u.id,
                module: 'admin',
                type: 'User Creation',
                title: `User account — ${u.name}`,
                project: u.department ?? 'Admin',
                requestedBy: u.name,
                date: u.createdAt,
                status: 'pending',
                urgency: 'normal',
                description: `Pending account for ${u.email}`,
            })));
        }

        return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    async referenceData() {
        const [
            projects,
            suppliers,
            materials,
            stores,
            departments,
            claimTypes,
            leaveTypes,
            chartAccounts,
        ] = await Promise.all([
            this.prisma.project.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.supplier.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.material.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.store.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.department.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.claimType.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.leaveType.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.chartAccount.findMany({ orderBy: { code: 'asc' } }),
        ]);

        return {
            projects: projects.map((p) => ({ id: p.id, name: p.name, status: p.status, type: p.type })),
            suppliers: suppliers.map((s) => ({ id: s.id, name: s.name, categories: s.categories })),
            materials: materials.map((m) => ({ id: m.id, name: m.name, category: m.category, unit: m.unit })),
            stores: stores.map((s) => ({ id: s.id, name: s.name, type: s.type, projectName: s.projectName })),
            departments: departments.map((d) => ({ id: d.id, name: d.name })),
            claimTypes: claimTypes.map((c) => ({ id: c.id, name: c.name })),
            leaveTypes: leaveTypes.map((l) => ({ id: l.id, name: l.name })),
            chartAccounts: chartAccounts.map((a) => ({ id: a.id, code: a.code, name: a.name, type: a.type })),
        };
    }

    async systemSummary() {
        const [users, roles, pendingApprovals] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.appRole.count(),
            this.findApprovals('all').then((rows) => rows.filter((r) => r.status === 'pending').length),
        ]);
        return {
            users,
            roles,
            activeSessions: 0,
            pendingApprovals,
            health: {
                status: 'healthy',
                uptimeSeconds: Math.round(process.uptime()),
                checkedAt: new Date(),
            },
        };
    }

    async activityLog() {
        const users = await this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: 8,
            select: { id: true, name: true, email: true, status: true, createdAt: true },
        });
        return users.map((u) => ({
            id: u.id,
            actor: u.name,
            action: 'User account updated',
            subject: u.email,
            status: u.status,
            date: u.createdAt,
        }));
    }

    // ── Users ──
    findAllUsers(search?: string) {
        return this.prisma.user.findMany({
            where: search
                ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {},
            select: {
                id: true, name: true, email: true, role: true,
                department: true, phone: true, status: true, lastLogin: true,
                createdAt: true,
            },
            orderBy: { name: 'asc' },
        });
    }

    findUser(id: string) {
        return this.prisma.user.findUniqueOrThrow({
            where: { id },
            select: {
                id: true, name: true, email: true, role: true,
                department: true, phone: true, status: true, lastLogin: true,
                createdAt: true,
            },
        });
    }

    async createUser(data: any) {
        const hashed = await bcrypt.hash(data.password || 'BuildOS@2025', 10);
        return this.prisma.user.create({
            data: { ...data, password: hashed },
            select: {
                id: true, name: true, email: true, role: true,
                department: true, phone: true, status: true, createdAt: true,
            },
        });
    }

    async updateUser(id: string, data: any) {
        const { password, ...rest } = data;
        const update: any = { ...rest };
        if (password) update.password = await bcrypt.hash(password, 10);
        return this.prisma.user.update({
            where: { id },
            data: update,
            select: {
                id: true, name: true, email: true, role: true,
                department: true, phone: true, status: true, createdAt: true,
            },
        });
    }

    deleteUser(id: string) {
        return this.prisma.user.delete({ where: { id } });
    }

    // ── App Roles ──
    findAllRoles() {
        return this.prisma.appRole.findMany({ orderBy: { name: 'asc' } });
    }
    findRole(id: string) {
        return this.prisma.appRole.findUniqueOrThrow({ where: { id } });
    }
    createRole(data: any) {
        return this.prisma.appRole.create({ data });
    }
    updateRole(id: string, data: any) {
        return this.prisma.appRole.update({ where: { id }, data });
    }
    deleteRole(id: string) {
        return this.prisma.appRole.delete({ where: { id } });
    }
}
