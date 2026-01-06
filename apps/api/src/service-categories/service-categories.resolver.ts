import { Resolver, Query, Args, Float } from '@nestjs/graphql';
import { ServiceCategoriesService } from './service-categories.service';
import { ServiceCategoryGraphQL } from './service-category.model';

/**
 * ServiceCategoriesResolver
 * GraphQL resolver for service categories
 */
@Resolver(() => ServiceCategoryGraphQL)
export class ServiceCategoriesResolver {
  constructor(private readonly serviceCategoriesService: ServiceCategoriesService) {}

  /**
   * Query: serviceCategories
   * Returns all active service categories ordered by name
   */
  @Query(() => [ServiceCategoryGraphQL], {
    name: 'serviceCategories',
    description: 'Get all active service categories',
  })
  async getServiceCategories(): Promise<ServiceCategoryGraphQL[]> {
    return this.serviceCategoriesService.getActiveCategories();
  }

  /**
   * Query: calculateServicePrice
   * Calculate estimated price for a service category with complexity factor
   */
  @Query(() => Float, {
    name: 'calculateServicePrice',
    description: 'Calculate estimated price for a service based on category and complexity',
  })
  async calculateServicePrice(
    @Args('categoryId') categoryId: string,
    @Args('complexityFactor', { type: () => Float, defaultValue: 1.0 }) 
    complexityFactor: number,
  ): Promise<number> {
    return this.serviceCategoriesService.calculateEstimatedPrice(
      categoryId,
      complexityFactor,
    );
  }
}
