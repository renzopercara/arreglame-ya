import { DifficultyLevel } from '../../domain/enums/difficulty-level.enum';
import { GeoLocation } from '../../domain/value-objects/geo-location.vo';
import { SquareMeters } from '../../domain/value-objects/square-meters.vo';

/**
 * PricingContext
 * All inputs required by the pricing engine to calculate a price.
 * Never trust a price sent from the frontend – always recalculate here.
 */
export interface PricingContext {
  /** Tenant identifier for multi-tenant pricing isolation */
  tenantId: string;
  /** Service category driving the pricing strategy selection */
  serviceCategoryId: string;
  /** Validated area of the service */
  squareMeters: SquareMeters;
  /** Difficulty level affecting the pricing multiplier */
  difficultyLevel: DifficultyLevel;
  /** Geographic location for zone-based adjustments */
  geoLocation: GeoLocation;
  /** Timestamp enabling future surge-pricing logic */
  timestamp: Date;
}

/**
 * PriceAdjustment
 * An individual adjustment applied on top of the base price.
 */
export interface PriceAdjustment {
  /** Human-readable label for the adjustment (e.g. "Difficulty HARD") */
  label: string;
  /** Signed amount in the smallest currency unit (e.g. ARS cents) */
  amount: number;
}

/**
 * PricingResult
 * Immutable snapshot returned by the pricing engine.
 * Every field is stored verbatim so disputes can always be audited.
 */
export interface PricingResult {
  /** Base price for the service before any adjustments */
  baseAmount: number;
  /** Variable amount derived from area and multipliers */
  variableAmount: number;
  /** All individual adjustments applied */
  adjustments: PriceAdjustment[];
  /** Final price the client pays (baseAmount + variableAmount + sum(adjustments)) */
  finalAmount: number;
  /** Monotonically increasing version string for this pricing rule set */
  pricingVersion: string;
  /** Currency code (ISO 4217) */
  currency: string;
}
