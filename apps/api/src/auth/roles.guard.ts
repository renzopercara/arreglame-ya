import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY, ACTIVE_ROLE_KEY } from './roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredActiveRole = this.reflector.getAllAndOverride<string>(ACTIVE_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles specified, allow access
    if (!requiredRoles && !requiredActiveRole) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Check if user has required role(s) - now supports multiple roles
    if (requiredRoles) {
      // User can have multiple roles, check if they have at least one required role
      const userRoles: string[] = Array.isArray(user.roles)
        ? [...new Set(user.roles as string[])]
        : [user.currentRole ?? user.role].filter((r): r is string => typeof r === 'string');
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        const roleNameMap: Record<string, string> = {
          'WORKER': 'Profesional',
          'CLIENT': 'Cliente',
          'ADMIN': 'Administrador',
        };
        const friendlyRoles = requiredRoles.map(r => roleNameMap[r] || r).join(', ');
        throw new ForbiddenException(
          `Se requiere uno de los siguientes roles: ${friendlyRoles}`
        );
      }
    }

    // Check if user has required active role
    // Fetch from database to ensure we have the latest activeRole after role switching
    if (requiredActiveRole) {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { activeRole: true },
      });

      // If user not found in database, their token is invalid - reject
      if (!dbUser) {
        throw new ForbiddenException('Usuario no encontrado o token inválido');
      }

      const currentActiveRole = dbUser.activeRole;
      
      if (currentActiveRole !== requiredActiveRole) {
        const modeNameMap: Record<string, string> = {
          'WORKER': 'Profesional',
          'CLIENT': 'Cliente',
        };
        const friendlyMode = modeNameMap[requiredActiveRole] || requiredActiveRole;
        throw new ForbiddenException(
          `Esta acción requiere estar en modo ${friendlyMode}`
        );
      }
    }

    return true;
  }
}
