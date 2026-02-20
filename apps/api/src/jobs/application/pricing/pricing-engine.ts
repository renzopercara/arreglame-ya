import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PricingStrategy } from './strategies/base.strategy';
import { LawnMowingPricingStrategy } from './strategies/lawn-mowing.strategy';
import { PricingContext, PricingResult } from './pricing-context';

/**
 * PricingEngine
 *
 * Selects the appropriate PricingStrategy for a given service category
 * and delegates calculation to it. New strategies are registered here
 * without changing any existing code (Open/Closed Principle).
 */
@Injectable()
export class PricingEngine {
  private readonly logger = new Logger(PricingEngine.name);
  private readonly strategies: Map<string, PricingStrategy> = new Map();

  constructor(lawnMowing: LawnMowingPricingStrategy) {
    this.register(lawnMowing);
  }

  /**
   * Register a strategy for the categories it supports.
   * Called automatically via the constructor for built-in strategies;
   * can also be called dynamically when loading tenant-specific overrides.
   */
  register(strategy: PricingStrategy): void {
    for (const category of strategy.supportedCategories) {
      this.strategies.set(category, strategy);
    }
    this.logger.debug(
      `Registered pricing strategy ${strategy.constructor.name} for: ${strategy.supportedCategories.join(', ')}`,
    );
  }

  /**
   * Calculate a pricing result. NEVER call this with a price from the frontend –
   * always call it with validated, server-side data.
   */
  calculate(context: PricingContext): PricingResult {
    const strategy = this.strategies.get(context.serviceCategoryId);

    if (!strategy) {
      this.logger.warn(
        `No pricing strategy found for category "${context.serviceCategoryId}". ` +
          `Available: ${[...this.strategies.keys()].join(', ')}`,
      );
      throw new NotFoundException(
        `No pricing strategy registered for service category: ${context.serviceCategoryId}`,
      );
    }

    this.logger.debug(
      `Calculating price for category "${context.serviceCategoryId}" ` +
        `using ${strategy.constructor.name} v${strategy.version}`,
    );

    return strategy.calculate(context);
  }

  /**
   * Check whether a pricing strategy is available for a given category.
   */
  hasStrategy(serviceCategoryId: string): boolean {
    return this.strategies.has(serviceCategoryId);
  }
}
