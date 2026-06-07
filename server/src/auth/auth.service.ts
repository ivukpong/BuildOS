import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private config: ConfigService,
    ) { }

    private parseDurationToMs(value: string): number {
        const match = String(value).trim().match(/^(\d+)([smhd])$/i);
        if (!match) {
            throw new BadRequestException(`Invalid duration value: ${value}`);
        }

        const amount = Number(match[1]);
        const unit = match[2].toLowerCase();
        const factor =
            unit === 's'
                ? 1000
                : unit === 'm'
                    ? 60_000
                    : unit === 'h'
                        ? 3_600_000
                        : 86_400_000;

        return amount * factor;
    }

    private getAccessTokenTtl(): string {
        return this.config.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';
    }

    private getRefreshTokenTtl(): string {
        return this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '60m';
    }

    private getRefreshTokenSecret(): string {
        return this.config.get<string>('JWT_REFRESH_SECRET') || 'buildos_refresh_secret_change_in_production';
    }

    private getPrivilegedAdminEmail(): string {
        return (this.config.get<string>('SEED_ADMIN_EMAIL') || 'admin@buildos.ng').trim().toLowerCase();
    }

    private getAllApps(): string[] {
        return ['construction', 'finance', 'hr', 'procurement', 'admin', 'ess', 'storefront'];
    }

    private async ensurePrivilegedAdminAccount(user: User) {
        const privilegedEmail = this.getPrivilegedAdminEmail();
        if (user.email.trim().toLowerCase() !== privilegedEmail) {
            return user;
        }

        const allApps = this.getAllApps();
        const hasAllApps = allApps.every((app) => Array.isArray(user.assignedApps) && user.assignedApps.includes(app));
        const isAdmin = String(user.role || '').trim().toLowerCase() === 'admin';

        if (isAdmin && hasAllApps) {
            return user;
        }

        const updated = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                role: 'admin',
                assignedApps: allApps,
            },
        });

        return updated;
    }

    private async issueTokenPair(user: { id: string; email: string; role: string }) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessTtl = this.getAccessTokenTtl();
        const refreshTtl = this.getRefreshTokenTtl();

        const access_token = this.jwtService.sign(payload, {
            expiresIn: accessTtl,
        });

        const refresh_token = this.jwtService.sign(payload, {
            secret: this.getRefreshTokenSecret(),
            expiresIn: refreshTtl,
        });

        const refreshTokenHash = await bcrypt.hash(refresh_token, 10);
        const refreshTokenExpiresAt = new Date(Date.now() + this.parseDurationToMs(refreshTtl));

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                refreshTokenHash,
                refreshTokenExpiresAt,
            },
        });

        return {
            access_token,
            refresh_token,
            access_expires_in: accessTtl,
            refresh_expires_in: refreshTtl,
        };
    }

    async login(email: string, password: string) {
        const normalizedEmail = email.trim().toLowerCase();
        const foundUser = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
        const user = foundUser ? await this.ensurePrivilegedAdminAccount(foundUser) : null;
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new UnauthorizedException('Invalid credentials');

        // Update lastLogin timestamp so "Last Active" reflects real activity
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        const tokenPair = await this.issueTokenPair({ id: user.id, email: user.email, role: user.role });
        return {
            ...tokenPair,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                assignedApps: user.assignedApps,
            },
        };
    }

    async register(name: string, email: string, password: string) {
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) throw new ConflictException('Email already in use');

        const hashed = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: {
                name,
                email,
                password: hashed,
                role: 'admin',
                assignedApps: ['construction', 'finance', 'hr', 'procurement', 'admin', 'ess', 'storefront'],
            },
        });

        const tokenPair = await this.issueTokenPair({ id: user.id, email: user.email, role: user.role });
        return {
            ...tokenPair,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                assignedApps: user.assignedApps,
            },
        };
    }

    async verifyEmail(token: string) {
        // Accept any 6-digit numeric token; production would check a stored OTP
        if (!token || !/^\d{6}$/.test(token)) {
            throw new UnauthorizedException('Invalid verification code');
        }
        return { verified: true };
    }

    async getMe(userId: string) {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true, department: true, phone: true },
        });
        const employee = await this.prisma.employee.findUnique({
            where: { email: user.email },
            include: { department: true },
        });
        return { user, employee };
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
        const updated = await this.prisma.user.update({
            where: { id: user.id },
            data: { password: hashed, status: 'Active', inviteToken: null, inviteExpiresAt: null },
        });

        const tokenPair = await this.issueTokenPair({ id: updated.id, email: updated.email, role: updated.role });
        return {
            ...tokenPair,
            user: {
                id: updated.id,
                email: updated.email,
                name: updated.name,
                role: updated.role,
                assignedApps: updated.assignedApps,
            },
        };
    }

    async refresh(refreshToken: string) {
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token is required');
        }

        let payload: { sub: string; email: string; role: string };
        try {
            payload = this.jwtService.verify<{ sub: string; email: string; role: string }>(refreshToken, {
                secret: this.getRefreshTokenSecret(),
            });
        } catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        const foundUser = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        const user = foundUser ? await this.ensurePrivilegedAdminAccount(foundUser) : null;
        if (!user || !user.refreshTokenHash || !user.refreshTokenExpiresAt) {
            throw new UnauthorizedException('Refresh token is not recognized');
        }

        if (user.refreshTokenExpiresAt.getTime() < Date.now()) {
            await this.clearRefreshToken(user.id);
            throw new UnauthorizedException('Refresh token has expired');
        }

        const tokenMatches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
        if (!tokenMatches) {
            throw new UnauthorizedException('Refresh token does not match');
        }

        const tokenPair = await this.issueTokenPair({ id: user.id, email: user.email, role: user.role });
        return {
            ...tokenPair,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                assignedApps: user.assignedApps,
            },
        };
    }

    async clearRefreshToken(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                refreshTokenHash: null,
                refreshTokenExpiresAt: null,
            },
        });
    }

    async forgotPassword(email: string) {
        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Check if user exists (don't reveal whether email exists for security)
        const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) {
            // Return success regardless (avoid user enumeration)
            return { success: true, message: 'If an account with this email exists, a password reset link will be sent' };
        }

        // In a production system, you would:
        // 1. Generate a reset token (e.g., crypto.randomBytes)
        // 2. Store it in the database with an expiration time
        // 3. Send an email with a reset link containing the token
        // 4. The user clicks the link and enters a new password
        //
        // For now, we'll just indicate success
        return { success: true, message: 'If an account with this email exists, a password reset link will be sent' };
    }
}