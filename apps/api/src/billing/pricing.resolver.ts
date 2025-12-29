import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { 
  PricingService, 
  CategoryInfo, 
  SubcategoryInfo, 
  PriceEstimateResult, 
  PriceEstimateInput, 
  ServiceCategory 
} from './pricing.service';
import { AuthGuard } from '../auth/auth.guard';

@Resolver()
export class PricingResolver {
  constructor(private pricingService: PricingService) {}

  @Query(() => [CategoryInfo], { name: 'getServiceCategories' })
  async getServiceCategories() {
    return this.pricingService.getCategories();
  }

  @Query(() => [SubcategoryInfo])
  async getServiceSubcategories(
    @Args('category', { type: () => ServiceCategory }) category: ServiceCategory
  ) {
    return this.pricingService.getSubcategories(category);
  }

  @Mutation(() => PriceEstimateResult)
  @UseGuards(AuthGuard)
  async estimateServicePrice(
    @Args('input', { type: () => PriceEstimateInput }) input: PriceEstimateInput
  ) {
    return this.pricingService.estimatePrice(input);
  }
}