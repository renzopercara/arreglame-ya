import { PricingContext, PricingResult } from '../pricing-context';

/**
 * PricingStrategy – Strategy Pattern Interface
 *
 * Each service category (lawn mowing, plumbing, electrical, …) implements
 * its own strategy. New services are added without touching existing code.
 */
export interface PricingStrategy {
  /**
   * Calculate a pricing result for the given context.
   * Implementations MUST be deterministic and side-effect free.
   */
  calculate(context: PricingContext): PricingResult;

  /**
   * The pricing version string returned in every PricingResult.
   * Increment when pricing rules change to keep an audit trail.
   */
  readonly version: string;

  /**
   * The service-category slug(s) this strategy handles.
   * Used by PricingEngine to select the correct strategy.
   */
  readonly supportedCategories: ReadonlyArray<string>;
}
