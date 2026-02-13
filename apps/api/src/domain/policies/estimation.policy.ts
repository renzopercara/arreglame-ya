import { Injectable } from '@nestjs/common';
import { AiEstimation } from '../value-objects/ai-estimation.vo';
import { Money } from '../value-objects/money.vo';

/**
 * EstimationPolicy
 * Business rules for AI estimation and pricing
 */
@Injectable()
export class EstimationPolicy {
  constructor(
    private readonly baseRatePerM2: number = 150, // ARS per square meter
    private readonly baseRatePerHour: number = 2000, // ARS per hour
    private readonly currency: string = 'ARS',
  ) {}

  /**
   * Calculate base price from AI estimation
   */
  calculateBasePrice(estimation: AiEstimation, squareMeters: number): Money {
    // Use AI suggestion as starting point
    let baseAmount = estimation.suggestedBasePrice;

    // If no AI suggestion, fallback to formula
    if (baseAmount <= 0) {
      baseAmount = squareMeters * this.baseRatePerM2;
    }

    // Apply difficulty multiplier
    const difficultyMultiplier = 1 + estimation.difficultyScore / 10;
    const adjustedAmount = baseAmount * difficultyMultiplier;

    // Ensure minimum viable pricing
    const minimumPrice = estimation.estimatedHours * this.baseRatePerHour;
    const finalAmount = Math.max(adjustedAmount, minimumPrice);

    return Money.from(finalAmount, this.currency);
  }

  /**
   * Validate estimation is reasonable
   */
  validateEstimation(estimation: AiEstimation): void {
    if (estimation.difficultyScore < 0 || estimation.difficultyScore > 10) {
      throw new Error(
        `Invalid difficulty score: ${estimation.difficultyScore}`,
      );
    }

    if (estimation.estimatedHours <= 0 || estimation.estimatedHours > 24) {
      throw new Error(`Invalid estimated hours: ${estimation.estimatedHours}`);
    }

    if (
      estimation.suggestedBasePrice < 0 ||
      estimation.suggestedBasePrice > 1000000
    ) {
      throw new Error(
        `Invalid suggested price: ${estimation.suggestedBasePrice}`,
      );
    }
  }

  /**
   * Apply multipliers (e.g., high weeds, terrain difficulty)
   */
  applyMultipliers(
    basePrice: Money,
    multipliers: { [key: string]: number },
  ): Money {
    let result = basePrice;

    for (const [name, value] of Object.entries(multipliers)) {
      if (value > 0) {
        result = result.multiply(value);
      }
    }

    return result;
  }
}
