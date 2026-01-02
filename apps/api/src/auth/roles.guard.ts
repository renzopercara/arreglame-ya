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

    // Check if user has required role
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`
      );
    }

    // Check if user has required active role
    if (requiredActiveRole && user.activeRole !== requiredActiveRole) {
      throw new ForbiddenException(
        `Esta acción requiere estar en modo ${requiredActiveRole === 'PROVIDER' ? 'Profesional' : 'Cliente'}`
      );
    }

    return true;
  }
}
