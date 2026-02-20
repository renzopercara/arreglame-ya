import { LawnMowingPricingStrategy } from './strategies/lawn-mowing.strategy';
import { PricingEngine } from './pricing-engine';
import { DifficultyLevel } from '../../domain/enums/difficulty-level.enum';
import { GeoLocation } from '../../domain/value-objects/geo-location.vo';
import { SquareMeters } from '../../domain/value-objects/square-meters.vo';
import { PricingContext } from './pricing-context';

const buildContext = (overrides: Partial<PricingContext> = {}): PricingContext => ({
  tenantId: 'tenant-1',
  serviceCategoryId: 'lawn-mowing',
  squareMeters: SquareMeters.from(100),
  difficultyLevel: DifficultyLevel.MEDIUM,
  geoLocation: GeoLocation.from(-34.6037, -58.3816),
  timestamp: new Date('2025-01-01T12:00:00Z'),
  ...overrides,
});

describe('LawnMowingPricingStrategy', () => {
  let strategy: LawnMowingPricingStrategy;

  beforeEach(() => {
    strategy = new LawnMowingPricingStrategy();
  });

  describe('Deterministic output', () => {
    it('returns the same result for the same input', () => {
      const ctx = buildContext();
      const r1 = strategy.calculate(ctx);
      const r2 = strategy.calculate(ctx);

      expect(r1.finalAmount).toBe(r2.finalAmount);
      expect(r1.pricingVersion).toBe(r2.pricingVersion);
    });
  });

  describe('Base price calculation', () => {
    it('always includes a positive base amount', () => {
      const result = strategy.calculate(buildContext());
      expect(result.baseAmount).toBeGreaterThan(0);
    });

    it('includes pricingVersion', () => {
      const result = strategy.calculate(buildContext());
      expect(result.pricingVersion).toBe('1.0.0');
    });

    it('includes currency', () => {
      const result = strategy.calculate(buildContext());
      expect(result.currency).toBe('ARS');
    });
  });

  describe('Difficulty multipliers', () => {
    it('EASY produces the lowest price', () => {
      const easy = strategy.calculate(buildContext({ difficultyLevel: DifficultyLevel.EASY }));
      const medium = strategy.calculate(buildContext({ difficultyLevel: DifficultyLevel.MEDIUM }));
      const hard = strategy.calculate(buildContext({ difficultyLevel: DifficultyLevel.HARD }));

      expect(easy.finalAmount).toBeLessThan(medium.finalAmount);
      expect(medium.finalAmount).toBeLessThan(hard.finalAmount);
    });

    it('HARD price is greater than MEDIUM price', () => {
      const medium = strategy.calculate(buildContext({ difficultyLevel: DifficultyLevel.MEDIUM }));
      const hard = strategy.calculate(buildContext({ difficultyLevel: DifficultyLevel.HARD }));
      expect(hard.finalAmount).toBeGreaterThan(medium.finalAmount);
    });
  });

  describe('Price monotonicity (property-based)', () => {
    it('price must not decrease as squareMeters increases', () => {
      const areas = [10, 50, 100, 200, 500, 1000];
      let previousFinal = -Infinity;

      for (const area of areas) {
        const result = strategy.calculate(
          buildContext({ squareMeters: SquareMeters.from(area) }),
        );
        expect(result.finalAmount).toBeGreaterThanOrEqual(previousFinal);
        previousFinal = result.finalAmount;
      }
    });
  });

  describe('Edge values', () => {
    it('handles minimum squareMeters (> 0)', () => {
      const result = strategy.calculate(
        buildContext({ squareMeters: SquareMeters.from(0.01) }),
      );
      expect(result.finalAmount).toBeGreaterThan(0);
    });

    it('handles very large squareMeters', () => {
      const result = strategy.calculate(
        buildContext({ squareMeters: SquareMeters.from(100000) }),
      );
      expect(result.finalAmount).toBeGreaterThan(0);
      expect(Number.isFinite(result.finalAmount)).toBe(true);
    });
  });

  describe('Rounding precision', () => {
    it('final amount has at most 2 decimal places', () => {
      const areas = [33, 77, 123, 456];
      for (const area of areas) {
        const result = strategy.calculate(
          buildContext({ squareMeters: SquareMeters.from(area) }),
        );
        const decimals = (result.finalAmount.toString().split('.')[1] || '').length;
        expect(decimals).toBeLessThanOrEqual(2);
      }
    });
  });

  describe('Adjustments', () => {
    it('includes at least one adjustment entry', () => {
      const result = strategy.calculate(buildContext());
      expect(result.adjustments.length).toBeGreaterThanOrEqual(1);
    });

    it('each adjustment has a label and amount', () => {
      const result = strategy.calculate(buildContext());
      for (const adj of result.adjustments) {
        expect(typeof adj.label).toBe('string');
        expect(typeof adj.amount).toBe('number');
      }
    });
  });

  describe('supportedCategories', () => {
    it('supports lawn-mowing and corte-de-pasto', () => {
      expect(strategy.supportedCategories).toContain('lawn-mowing');
      expect(strategy.supportedCategories).toContain('corte-de-pasto');
    });
  });
});

describe('PricingEngine', () => {
  let engine: PricingEngine;
  let strategy: LawnMowingPricingStrategy;

  beforeEach(() => {
    strategy = new LawnMowingPricingStrategy();
    engine = new PricingEngine(strategy);
  });

  it('calculates price for a registered category', () => {
    const result = engine.calculate(buildContext({ serviceCategoryId: 'lawn-mowing' }));
    expect(result.finalAmount).toBeGreaterThan(0);
  });

  it('throws NotFoundException for an unknown category', () => {
    expect(() =>
      engine.calculate(buildContext({ serviceCategoryId: 'unknown-category' })),
    ).toThrow();
  });

  it('hasStrategy returns true for registered categories', () => {
    expect(engine.hasStrategy('lawn-mowing')).toBe(true);
    expect(engine.hasStrategy('corte-de-pasto')).toBe(true);
  });

  it('hasStrategy returns false for unregistered categories', () => {
    expect(engine.hasStrategy('plumbing')).toBe(false);
  });
});

describe('GeoLocation value object', () => {
  it('creates a valid location', () => {
    const loc = GeoLocation.from(-34.6037, -58.3816);
    expect(loc.latitude).toBe(-34.6037);
    expect(loc.longitude).toBe(-58.3816);
  });

  it('throws on invalid latitude', () => {
    expect(() => GeoLocation.from(91, 0)).toThrow();
    expect(() => GeoLocation.from(-91, 0)).toThrow();
  });

  it('throws on invalid longitude', () => {
    expect(() => GeoLocation.from(0, 181)).toThrow();
    expect(() => GeoLocation.from(0, -181)).toThrow();
  });
});

describe('SquareMeters value object', () => {
  it('creates a valid instance', () => {
    const sm = SquareMeters.from(100);
    expect(sm.value).toBe(100);
  });

  it('throws on zero', () => {
    expect(() => SquareMeters.from(0)).toThrow();
  });

  it('throws on negative values', () => {
    expect(() => SquareMeters.from(-1)).toThrow();
  });

  it('throws on NaN', () => {
    expect(() => SquareMeters.from(NaN)).toThrow();
  });

  it('throws on Infinity', () => {
    expect(() => SquareMeters.from(Infinity)).toThrow();
  });
});
