import { Injectable } from '@nestjs/common';
import { DifficultyLevel } from '../../../domain/enums/difficulty-level.enum';
import { PricingContext, PricingResult, PriceAdjustment } from '../pricing-context';
import { PricingStrategy } from './base.strategy';

/**
 * Difficulty multipliers applied on top of the base price.
 * Composition over conditionals: each enum value maps to a named multiplier.
 */
const DIFFICULTY_MULTIPLIERS: Record<DifficultyLevel, number> = {
  [DifficultyLevel.EASY]: 1.0,
  [DifficultyLevel.MEDIUM]: 1.3,
  [DifficultyLevel.HARD]: 1.7,
};

/**
 * LawnMowingPricingStrategy
 *
 * Implements the pricing formula for the "Corte de Pasto" service category.
 * Supports: basePrice + pricePerSquareMeter × area × difficultyMultiplier
 * with a zone-adjustment hook ready for future geographic pricing.
 */
@Injectable()
export class LawnMowingPricingStrategy implements PricingStrategy {
  readonly version = '1.0.0';
  readonly supportedCategories: ReadonlyArray<string> = ['lawn-mowing', 'corte-de-pasto'];

  /** Fixed base price regardless of area (ARS) */
  private readonly basePrice = 500;
  /** Price per square meter of lawn (ARS) */
  private readonly pricePerSquareMeter = 150;

  calculate(context: PricingContext): PricingResult {
    const { squareMeters, difficultyLevel } = context;
    const currency = 'ARS';

    // 1. Variable amount: area × rate × difficulty
    const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficultyLevel];
    const variableAmount =
      squareMeters.value * this.pricePerSquareMeter * difficultyMultiplier;

    // 2. Build adjustments list for full auditability
    const adjustments: PriceAdjustment[] = [
      {
        label: `Difficulty ${difficultyLevel} (×${difficultyMultiplier})`,
        amount: variableAmount - squareMeters.value * this.pricePerSquareMeter,
      },
    ];

    // 3. Zone adjustment hook – always add it (0 until geo-pricing rules are live)
    const zoneAdjustment = this.calculateZoneAdjustment(context);
    if (zoneAdjustment !== 0) {
      adjustments.push({ label: 'Zone adjustment', amount: zoneAdjustment });
    }

    const finalAmount = Math.round(
      (this.basePrice +
        squareMeters.value * this.pricePerSquareMeter * difficultyMultiplier +
        zoneAdjustment) *
        100,
    ) / 100; // 2 decimal precision

    return {
      baseAmount: this.basePrice,
      variableAmount: squareMeters.value * this.pricePerSquareMeter * difficultyMultiplier,
      adjustments,
      finalAmount,
      pricingVersion: this.version,
      currency,
    };
  }

  /**
   * Zone adjustment hook.
   * Currently returns 0; wire a geo-pricing service here when ready.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private calculateZoneAdjustment(_context: PricingContext): number {
    return 0;
  }
}
