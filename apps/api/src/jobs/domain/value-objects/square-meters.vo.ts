/**
 * SquareMeters Value Object
 * Ensures area measurements are always positive.
 * Prevents invalid dimensions from reaching the pricing engine.
 */
export class SquareMeters {
  private constructor(public readonly value: number) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`Invalid squareMeters: ${value}. Must be a positive number.`);
    }
  }

  static from(value: number): SquareMeters {
    return new SquareMeters(value);
  }

  isGreaterThan(other: SquareMeters): boolean {
    return this.value > other.value;
  }

  equals(other: SquareMeters): boolean {
    return this.value === other.value;
  }

  toJSON(): { value: number } {
    return { value: this.value };
  }

  toString(): string {
    return `${this.value}m²`;
  }
}
