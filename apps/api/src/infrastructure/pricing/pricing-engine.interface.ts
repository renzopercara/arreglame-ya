import { AiEstimation } from '../../domain/value-objects/ai-estimation.vo';

/**
 * Pricing Engine Interface
 * Abstract interface for different pricing strategies
 */
export interface IPricingEngine {
  /**
   * Estimate service price from image and description
   */
  estimatePrice(
    imageBase64: string,
    description: string,
    squareMeters: number,
  ): Promise<AiEstimation>;

  /**
   * Check if this pricing engine is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get engine name for logging
   */
  getName(): string;
}
