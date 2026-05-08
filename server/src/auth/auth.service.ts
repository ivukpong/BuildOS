import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async login(email: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new UnauthorizedException('Invalid credentials');

        const payload = { sub: user.id, email: user.email, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };
    }

    async register(name: string, email: string, password: string) {
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) throw new ConflictException('Email already in use');

        const hashed = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: { name, email, password: hashed, role: 'admin' },
        });

        const payload = { sub: user.id, email: user.email, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
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
}
