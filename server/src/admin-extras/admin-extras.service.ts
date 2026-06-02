import { Injectable, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminExtrasService {
    private readonly logger = new Logger(AdminExtrasService.name);

    constructor(private prisma: PrismaService) { }

    private settingsFilePath = path.join(process.cwd(), 'data', 'admin-settings.json');

    private async readAdminSettings() {
        try {
            const raw = await fs.readFile(this.settingsFilePath, 'utf-8');
            const parsed = JSON.parse(raw);
            return {
                issueTypes: Array.isArray(parsed.issueTypes) ? parsed.issueTypes : [],
                changeCategories: Array.isArray(parsed.changeCategories) ? parsed.changeCategories : [],
            };
        } catch {
            return { issueTypes: [], changeCategories: [] };
        }
    }

    private async writeAdminSettings(data: { issueTypes: any[]; changeCategories: any[] }) {
        await fs.mkdir(path.dirname(this.settingsFilePath), { recursive: true });
        await fs.writeFile(this.settingsFilePath, JSON.stringify(data, null, 2), 'utf-8');
    }

    private async sendInviteEmail(email: string, name: string, activationLink: string): Promise<void> {
        const emailProvider = String(process.env.EMAIL_PROVIDER || 'resend').toLowerCase();
        if (emailProvider !== 'resend') {
            throw new BadRequestException(`Invite email provider '${emailProvider}' is not supported by this service`);
        }

        const resendApiKey = process.env.RESEND_API_KEY;
        // Keep backward compatibility while aligning with BuyOps variable naming.
        const from = process.env.EMAIL_FROM || process.env.INVITE_FROM_EMAIL;

        if (!resendApiKey || !from) {
            throw new BadRequestException('Invite email is not configured: set RESEND_API_KEY and EMAIL_FROM (or INVITE_FROM_EMAIL)');
        }

        const resend = new Resend(resendApiKey);
        await resend.emails.send({
            from,
            to: [email],
            subject: 'You are invited to BuildOS',
            text: `Hi ${name},\n\nYou have been invited to BuildOS. Activate your account here: ${activationLink}\n\nThis link expires in 7 days.`,
        });
    }

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
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [users, roles, pendingApprovals, usersThisMonth, pendingInvites, recentSessions] =
            await Promise.all([
                this.prisma.user.count(),
                this.prisma.appRole.count(),
                this.findApprovals('all').then((rows) => rows.filter((r) => r.status === 'pending').length),
                this.prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
                this.prisma.user.count({ where: { status: { in: ['pending_invite', 'invited', 'PENDING_INVITE'] } } }),
                this.prisma.user.count({ where: { lastLogin: { gte: since24h } } }),
            ]);

        // Health: verify DB is reachable; returns 100% for a healthy monolith
        let healthPercent = 100;
        try {
            await this.prisma.$queryRaw`SELECT 1`;
        } catch {
            healthPercent = 0;
        }

        return {
            users,
            roles,
            activeSessions: Math.max(recentSessions, 1), // at least 1 (caller is active)
            pendingApprovals,
            usersThisMonth,
            pendingInvites,
            healthPercent,
            health: {
                status: healthPercent === 100 ? 'healthy' : 'degraded',
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
    async inviteUser(data: { email: string; name: string; role?: string }) {
        const name = String(data?.name ?? '').trim();
        const role = String(data?.role ?? '').trim();
        const normalizedEmail = String(data?.email ?? '').trim().toLowerCase();

        if (!name) throw new BadRequestException('Name is required');
        if (!normalizedEmail) throw new BadRequestException('Email is required');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            throw new BadRequestException('Invalid email address');
        }
        if (!role) throw new BadRequestException('Role is required');

        const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing) throw new ConflictException('Email already registered');

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        // Placeholder password — cannot be used to log in; replaced on activation
        const placeholder = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);

        const user = await this.prisma.user.create({
            data: {
                email: normalizedEmail,
                name,
                role,
                password: placeholder,
                status: 'pending_invite',
                inviteToken: token,
                inviteExpiresAt: expiresAt,
            },
        });

        const frontendUrl = String(process.env.FRONTEND_URL || '').trim().replace(/\/$/, '');
        const activationPath = `/auth/activate?token=${token}`;
        const activationLink = frontendUrl ? `${frontendUrl}${activationPath}` : activationPath;

        try {
            await this.sendInviteEmail(normalizedEmail, name, activationLink);
        } catch (error) {
            await this.prisma.user.delete({ where: { id: user.id } }).catch(() => null);
            const reason = error instanceof Error ? error.message : 'unknown error';
            this.logger.warn(`Invite email failed for ${normalizedEmail}: ${reason}`);
            throw new BadRequestException(`Invite email failed: ${reason}`);
        }

        return {
            id: user.id,
            email: user.email,
            inviteToken: token,
            activationLink,
            inviteEmailSent: true,
        };
    }

    async activateInvite(token: string, password: string) {
        if (!token) throw new BadRequestException('Invite token is required');
        if (!password || password.length < 8) throw new BadRequestException('Password must be at least 8 characters');

        const user = await this.prisma.user.findFirst({ where: { inviteToken: token } });
        if (!user) throw new BadRequestException('Invalid or expired invite token');
        if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) {
            throw new BadRequestException('Invite token has expired');
        }

        const hashed = await bcrypt.hash(password, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { password: hashed, status: 'Active', inviteToken: null, inviteExpiresAt: null },
        });

        return { message: 'Account activated. You can now log in.' };
    }

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
        return this.prisma.appRole.deleteMany({ where: { id } });
    }

    // ── Issue Types ──
    async findAllIssueTypes() {
        const settings = await this.readAdminSettings();
        return settings.issueTypes;
    }

    async createIssueType(data: any) {
        const settings = await this.readAdminSettings();
        const next = {
            id: crypto.randomUUID(),
            name: data.name,
            description: data.description ?? '',
            priority: data.priority ?? 'medium',
            color: data.color ?? 'bg-red-100 text-red-700',
            slaHours: Number(data.slaHours ?? 24),
            active: data.active !== false,
        };
        settings.issueTypes.push(next);
        await this.writeAdminSettings(settings);
        return next;
    }

    async updateIssueType(id: string, data: any) {
        const settings = await this.readAdminSettings();
        const idx = settings.issueTypes.findIndex((item: any) => item.id === id);
        if (idx < 0) throw new BadRequestException('Issue type not found');
        settings.issueTypes[idx] = {
            ...settings.issueTypes[idx],
            ...data,
            id,
        };
        await this.writeAdminSettings(settings);
        return settings.issueTypes[idx];
    }

    async deleteIssueType(id: string) {
        const settings = await this.readAdminSettings();
        settings.issueTypes = settings.issueTypes.filter((item: any) => item.id !== id);
        await this.writeAdminSettings(settings);
        return { ok: true };
    }

    // ── Change Categories ──
    async findAllChangeCategories() {
        const settings = await this.readAdminSettings();
        return settings.changeCategories;
    }

    async createChangeCategory(data: any) {
        const settings = await this.readAdminSettings();
        const next = {
            id: crypto.randomUUID(),
            name: data.name,
            description: data.description ?? '',
        };
        settings.changeCategories.push(next);
        await this.writeAdminSettings(settings);
        return next;
    }

    async updateChangeCategory(id: string, data: any) {
        const settings = await this.readAdminSettings();
        const idx = settings.changeCategories.findIndex((item: any) => item.id === id);
        if (idx < 0) throw new BadRequestException('Change category not found');
        settings.changeCategories[idx] = {
            ...settings.changeCategories[idx],
            ...data,
            id,
        };
        await this.writeAdminSettings(settings);
        return settings.changeCategories[idx];
    }

    async deleteChangeCategory(id: string) {
        const settings = await this.readAdminSettings();
        settings.changeCategories = settings.changeCategories.filter((item: any) => item.id !== id);
        await this.writeAdminSettings(settings);
        return { ok: true };
    }

    // ── Company Profile ──
    async getCompanyProfile() {
        const profile = await this.prisma.companyProfile.findUnique({ where: { id: 'singleton' } });
        if (!profile) {
            return this.prisma.companyProfile.create({ data: { id: 'singleton' } });
        }
        return profile;
    }

    updateCompanyProfile(data: any) {
        const requiredFields = [
            { key: 'name', label: 'Company name' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone number' },
            { key: 'address', label: 'Address' },
            { key: 'city', label: 'City' },
            { key: 'state', label: 'State / Province' },
        ] as const;

        const missing = requiredFields
            .filter(({ key }) => !String(data?.[key] ?? '').trim())
            .map(({ label }) => label);

        if (missing.length > 0) {
            throw new BadRequestException(`Missing required fields: ${missing.join(', ')}`);
        }

        const email = String(data.email).trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new BadRequestException('Invalid email address');
        }

        const sanitized = {
            ...data,
            name: String(data.name).trim(),
            email,
            phone: String(data.phone).trim(),
            address: String(data.address).trim(),
            city: String(data.city).trim(),
            state: String(data.state).trim(),
            zipCode: String(data.zipCode ?? '').trim(),
            country: String(data.country ?? '').trim(),
        };

        const { id, updatedAt, ...rest } = sanitized;
        return this.prisma.companyProfile.upsert({
            where: { id: 'singleton' },
            create: { id: 'singleton', ...rest },
            update: rest,
        });
    }

    // ── Directors ──
    findAllDirectors() {
        return this.prisma.director.findMany({ orderBy: { sequence: 'asc' } });
    }
    createDirector(data: any) {
        return this.prisma.director.create({ data });
    }
    updateDirector(id: string, data: any) {
        const { id: _id, createdAt, updatedAt, ...rest } = data;
        return this.prisma.director.update({ where: { id }, data: rest });
    }
    deleteDirector(id: string) {
        return this.prisma.director.delete({ where: { id } });
    }
}
