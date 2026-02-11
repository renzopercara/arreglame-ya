import { registerEnumType } from '@nestjs/graphql';
import { 
  ServiceSubcategory, 
  DifficultyLevel,
  UserRole,
  ActiveRole
} from '@prisma/client';

/**
 * Centralized GraphQL Enum Registry
 * 
 * This file is the SINGLE source for registering Prisma enums with GraphQL.
 * All enums are imported from @prisma/client to ensure consistency.
 * 
 * DO NOT register enums elsewhere - this prevents duplicate type errors.
 */

// Register ServiceSubcategory enum
registerEnumType(ServiceSubcategory, {
  name: 'ServiceSubcategory',
  description: 'Service subcategories for different types of work',
});

// Register DifficultyLevel enum
registerEnumType(DifficultyLevel, {
  name: 'DifficultyLevel',
  description: 'Difficulty levels for service estimation',
});

// Register UserRole enum
registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'User roles for authentication and authorization (CLIENT, WORKER, ADMIN)',
});

// Register ActiveRole enum
registerEnumType(ActiveRole, {
  name: 'ActiveRole',
  description: 'Active UI context role (CLIENT or WORKER)',
});

/**
 * Note: ServiceCategory is now a Prisma model, not an enum.
 * Use the ServiceCategory model from @prisma/client instead.
 */
