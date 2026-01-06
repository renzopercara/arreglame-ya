import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { 
  PricingService, 
  PriceEstimateResult, 
  PriceEstimateInput, 
} from './pricing.service';
import { AuthGuard } from '../auth/auth.guard';

/**
 * PricingResolver
 * 
 * Note: Service category and subcategory queries have been moved to
 * ServiceCategoriesResolver to avoid GraphQL type collisions.
 */
@Resolver()
export class PricingResolver {
  constructor(private pricingService: PricingService) {}

  @Mutation(() => PriceEstimateResult)
  @UseGuards(AuthGuard)
  async estimateServicePrice(
    @Args('input', { type: () => PriceEstimateInput }) input: PriceEstimateInput
  ) {
    return this.pricingService.estimatePrice(input);
  }
}