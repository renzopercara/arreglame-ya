import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ServiceCategoryGraphQL } from './service-category.model';

/**
 * ServiceCategoriesService
 * Business logic for service categories and pricing calculations
 */
@Injectable()
export class ServiceCategoriesService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Get all active service categories
   * @returns Active categories ordered by name
   */
  async getActiveCategories(): Promise<ServiceCategoryGraphQL[]> {
    const categories = await this.prisma.serviceCategory.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      iconName: category.iconName,
      description: category.description,
      active: category.active,
      basePrice: category.basePrice.toNumber(),
      hourlyRate: category.hourlyRate.toNumber(),
      estimatedHours: category.estimatedHours,
    }));
  }

  /**
   * Get a single category by ID
   * @param id Category ID
   * @returns Category or null
   */
  async getCategoryById(id: string) {
    return this.prisma.serviceCategory.findUnique({
      where: { id },
    });
  }

  /**
   * Get a single category by slug
   * @param slug Category slug
   * @returns Category or null
   */
  async getCategoryBySlug(slug: string) {
    return this.prisma.serviceCategory.findUnique({
      where: { slug },
    });
  }

  /**
   * Calculate estimated price for a service
   * Formula: (basePrice + (hourlyRate * estimatedHours)) * complexityFactor
   * 
   * @param categoryId Category ID
   * @param complexityFactor Complexity multiplier (must be >= 1)
   * @returns Estimated price
   * @throws NotFoundException if category not found or inactive
   * @throws BadRequestException if complexityFactor < 1
   */
  async calculateEstimatedPrice(
    categoryId: string,
    complexityFactor: number,
  ): Promise<number> {
    // Validate complexity factor
    if (complexityFactor < 1) {
      throw new BadRequestException(
        `Complexity factor must be >= 1, received: ${complexityFactor}`,
      );
    }

    // Fetch category
    const category = await this.getCategoryById(categoryId);

    // Validate category exists and is active
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    if (!category.active) {
      throw new NotFoundException(
        `Category ${category.name} is currently inactive`,
      );
    }

    // Calculate price using the required formula
    const basePrice = new Prisma.Decimal(category.basePrice);
    const hourlyRate = new Prisma.Decimal(category.hourlyRate);

    const baseCalculation = basePrice.plus(
      hourlyRate.mul(category.estimatedHours),
    );

    const estimatedPrice = baseCalculation.mul(complexityFactor);

    return estimatedPrice.toNumber();
  }
}
