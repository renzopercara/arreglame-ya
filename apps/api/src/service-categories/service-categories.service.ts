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
   * Get active service categories that have at least one ONLINE/PAUSED worker
   * with an ACTIVE specialty within the given coverage radius.
   *
   * Uses a bounding box approximation for the spatial filter (1 degree ≈ 111 km).
   * This may include workers slightly outside the exact radius (at box corners) and
   * exclude workers exactly at the boundary – acceptable for discovery purposes.
   * Falls back to all active categories when no coordinates are provided.
   *
   * @param latitude  Client latitude
   * @param longitude Client longitude
   * @param radiusKm  Search radius in kilometres (default: 15)
   */
  async getActiveCategoriesNearby(
    latitude: number,
    longitude: number,
    radiusKm = 15,
  ): Promise<ServiceCategoryGraphQL[]> {
    // Haversine approximation: 1 degree ≈ 111 km
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

    // Find category IDs that have eligible workers in the area
    const workerSpecialties = await (this.prisma.workerSpecialty as any).findMany({
      where: {
        status: 'ACTIVE',
        worker: {
          status: { in: ['ONLINE', 'PAUSED'] },
          latitude: { gte: latitude - latDelta, lte: latitude + latDelta },
          longitude: { gte: longitude - lngDelta, lte: longitude + lngDelta },
        },
      },
      select: { categoryId: true },
      distinct: ['categoryId'],
    });

    const categoryIds = workerSpecialties.map((ws: { categoryId: string }) => ws.categoryId);

    if (categoryIds.length === 0) {
      // No nearby workers found – fall back to returning all active categories
      return this.getActiveCategories();
    }

    const categories = await this.prisma.serviceCategory.findMany({
      where: {
        active: true,
        id: { in: categoryIds },
      },
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
