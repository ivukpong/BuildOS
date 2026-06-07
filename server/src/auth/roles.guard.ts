import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { verify } from 'jsonwebtoken';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      'isPublic',
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        request.user = verify(
          token,
          process.env.JWT_SECRET || 'buildos_jwt_secret_change_in_production',
        ) as any;
      } catch {
        throw new ForbiddenException('User not authenticated');
      }
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      // No roles specified, allow access
      return true;
    }

    const user = request.user as any;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has any of the required roles (normalize to lowercase for case-insensitive comparison)
    const userRole = user.role || user.roles || [];
    const userRolesArray = Array.isArray(userRole) ? userRole : [userRole];
    const normalizedUserRoles = userRolesArray.map((r) => String(r).trim().toLowerCase());
    const normalizedRequiredRoles = requiredRoles.map((r) => String(r).trim().toLowerCase());

    const hasRole = normalizedRequiredRoles.some((role) =>
      normalizedUserRoles.includes(role),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `User does not have required role(s): ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
