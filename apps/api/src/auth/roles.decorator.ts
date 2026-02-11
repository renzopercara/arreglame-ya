import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const ACTIVE_ROLE_KEY = 'activeRole';

/**
 * Decorator to specify required user roles for a resolver/mutation
 * Example: @RequireRoles('WORKER', 'ADMIN')
 */
export const RequireRoles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Decorator to specify required active role for a resolver/mutation
 * Example: @RequireActiveRole('WORKER')
 */
export const RequireActiveRole = (activeRole: 'CLIENT' | 'WORKER') => 
  SetMetadata(ACTIVE_ROLE_KEY, activeRole);
