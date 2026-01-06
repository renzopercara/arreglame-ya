import { registerEnumType } from '@nestjs/graphql';
import { 
  ServiceSubcategory, 
  DifficultyLevel 
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

/**
 * Note: ServiceCategory is now a Prisma model, not an enum.
 * Use the ServiceCategory model from @prisma/client instead.
 */
