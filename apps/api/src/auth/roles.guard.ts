import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY, ACTIVE_ROLE_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
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

    // Check if user has required role(s) - AuthGuard hydrates fresh roles from DB
    if (requiredRoles) {
      const userRoles: string[] = Array.isArray(user.roles) ? [...user.roles] : [];
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

    // Check active role - AuthGuard hydrates fresh activeRole from DB
    if (requiredActiveRole) {
      if (user.activeRole !== requiredActiveRole) {
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
