import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService, private jwtService: JwtService) { }

    @Post('login')
    login(@Body() body: { email: string; password: string }) {
        return this.authService.login(body.email, body.password);
    }

    @Post('register')
    register(@Body() body: { name: string; email: string; password: string }) {
        return this.authService.register(body.name, body.email, body.password);
    }

    @Post('verify-email')
    verifyEmail(@Body() body: { token: string }) {
        return this.authService.verifyEmail(body.token);
    }

    @Post('activate')
    activate(@Body() body: { token: string; password: string }) {
        return this.authService.activateInvite(body.token, body.password);
    }

    @Get('me')
    async getMe(@Headers('authorization') auth: string) {
        if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('No token provided');
        const token = auth.split(' ')[1];
        let payload: { sub: string };
        try {
            payload = this.jwtService.verify<{ sub: string }>(token);
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
        return this.authService.getMe(payload.sub);
    }

    @Post('refresh')
    refresh(@Body() body: { refresh_token: string }) {
        return this.authService.refresh(body.refresh_token);
    }

    @Post('logout')
    async logout(@Headers('authorization') auth: string) {
        if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('No token provided');
        const token = auth.split(' ')[1];
        let payload: { sub: string };
        try {
            payload = this.jwtService.verify<{ sub: string }>(token);
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }

        await this.authService.clearRefreshToken(payload.sub);
        return { success: true };
    }

    @Post('forgot-password')
    forgotPassword(@Body() body: { email: string }) {
        return this.authService.forgotPassword(body.email);
    }
}
