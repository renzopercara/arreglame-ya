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
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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
      const userRoles = user.roles || [user.currentRole || user.role];
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
    if (requiredActiveRole && user.activeRole !== requiredActiveRole) {
      const modeNameMap: Record<string, string> = {
        'WORKER': 'Profesional',
        'CLIENT': 'Cliente',
      };
      const friendlyMode = modeNameMap[requiredActiveRole] || requiredActiveRole;
      throw new ForbiddenException(
        `Esta acción requiere estar en modo ${friendlyMode}`
      );
    }

    return true;
  }
}
