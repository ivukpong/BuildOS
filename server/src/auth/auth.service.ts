import { Injectable, UnauthorizedException, ConflictException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '@prisma/client';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

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

    private getJwtSecret(): string {
        return this.config.get<string>('JWT_SECRET') || 'buildos_jwt_secret_change_in_production';
    }

    private isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    private getFrontendBaseUrl(): string {
        const explicitUrl = this.config.get<string>('FRONTEND_URL')
            || this.config.get<string>('WEB_URL')
            || this.config.get<string>('APP_WEB_URL');

        if (explicitUrl) {
            return explicitUrl.replace(/\/$/, '');
        }

        return this.config.get<string>('NODE_ENV') === 'production'
            ? 'https://build-os-delta.vercel.app'
            : 'http://localhost:5173';
    }

    private async sendPasswordResetEmail(email: string, name: string, resetLink: string): Promise<void> {
        const resendApiKey = this.config.get<string>('RESEND_API_KEY');
        const from = this.config.get<string>('EMAIL_FROM') || this.config.get<string>('INVITE_FROM_EMAIL');

        if (!resendApiKey || !from) {
            throw new BadRequestException('Password reset email is not configured: set RESEND_API_KEY and EMAIL_FROM (or INVITE_FROM_EMAIL)');
        }

        const resend = new Resend(resendApiKey);
                const safeName = String(name || '').trim() || 'there';

                const result = await resend.emails.send({
            from,
            to: [email],
            subject: 'Reset your BuildOS password',
                        text: `Hi ${safeName},\n\nUse this link to reset your BuildOS password: ${resetLink}\n\nThis link expires in 30 minutes. If you did not request this, you can ignore this email.`,
            html: `
                                <div style="margin:0; padding:24px; background:#f3f6fb; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; color:#0f172a;">
                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden;">
                                        <tr>
                                            <td style="padding:24px 28px; background:linear-gradient(120deg, #1d4ed8, #2563eb); color:#ffffff;">
                                                <h1 style="margin:0; font-size:22px; line-height:1.2; font-weight:700;">BuildOS</h1>
                                                <p style="margin:8px 0 0; font-size:14px; opacity:.92;">Password reset request</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding:28px;">
                                                <p style="margin:0 0 14px; font-size:15px;">Hi ${safeName},</p>
                                                <p style="margin:0 0 18px; font-size:15px; line-height:1.6; color:#334155;">
                                                    We received a request to reset your BuildOS password. Click the button below to choose a new password.
                                                </p>
                                                <p style="margin:0 0 24px;">
                                                    <a href="${resetLink}" style="display:inline-block; padding:12px 20px; border-radius:10px; background:#2563eb; color:#ffffff; text-decoration:none; font-weight:600; font-size:14px;">Reset Password</a>
                                                </p>
                                                <p style="margin:0 0 8px; font-size:13px; color:#64748b; line-height:1.6;">
                                                    This link expires in <strong>30 minutes</strong>. If the button does not work, copy and paste this URL into your browser:
                                                </p>
                                                <p style="margin:0 0 18px; font-size:12px; word-break:break-all; color:#2563eb;">${resetLink}</p>
                                                <p style="margin:0; font-size:13px; color:#64748b; line-height:1.6;">
                                                    If you did not request this password reset, you can safely ignore this email.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
            `,
        });

                if ((result as { error?: unknown }).error) {
                        this.logger.error(`Password reset email failed for ${email}`);
                        throw new InternalServerErrorException('Unable to send password reset email at this time');
                }
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
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            throw new BadRequestException('Email is required');
        }
        if (!this.isValidEmail(normalizedEmail)) {
            throw new BadRequestException('Please enter a valid email address');
        }

        // Do not reveal whether email exists to prevent account enumeration.
        const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) {
            return { success: true, message: 'If an account with this email exists, a password reset link will be sent' };
        }

        const resetToken = this.jwtService.sign(
            { sub: user.id, email: user.email, type: 'password-reset' },
            { secret: this.getJwtSecret(), expiresIn: '30m' },
        );
        const resetLink = `${this.getFrontendBaseUrl()}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;

        await this.sendPasswordResetEmail(user.email, user.name, resetLink);
        return { success: true, message: 'If an account with this email exists, a password reset link will be sent' };
    }

    async resetPassword(token: string, password: string) {
        if (!token) {
            throw new BadRequestException('Reset token is required');
        }
        if (!password || password.length < 8) {
            throw new BadRequestException('Password must be at least 8 characters');
        }

        let payload: { sub: string; email: string; type?: string };
        try {
            payload = this.jwtService.verify<{ sub: string; email: string; type?: string }>(token, {
                secret: this.getJwtSecret(),
            });
        } catch {
            throw new UnauthorizedException('Invalid or expired reset token');
        }

        if (payload.type !== 'password-reset' || !payload.sub || !payload.email) {
            throw new UnauthorizedException('Invalid reset token');
        }

        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user || user.email.trim().toLowerCase() !== payload.email.trim().toLowerCase()) {
            throw new UnauthorizedException('Invalid reset token');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                refreshTokenHash: null,
                refreshTokenExpiresAt: null,
            },
        });

        return { success: true, message: 'Password has been reset successfully' };
    }
}