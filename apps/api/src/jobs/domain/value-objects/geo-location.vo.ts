/**
 * GeoLocation Value Object
 * Immutable geographic coordinate with validation.
 * Prevents primitive obsession for latitude/longitude pairs.
 */
export class GeoLocation {
  private constructor(
    public readonly latitude: number,
    public readonly longitude: number,
  ) {
    if (latitude < -90 || latitude > 90) {
      throw new Error(`Invalid latitude: ${latitude}. Must be between -90 and 90.`);
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error(`Invalid longitude: ${longitude}. Must be between -180 and 180.`);
    }
  }

  static from(latitude: number, longitude: number): GeoLocation {
    return new GeoLocation(latitude, longitude);
  }

  equals(other: GeoLocation): boolean {
    return this.latitude === other.latitude && this.longitude === other.longitude;
  }

  toJSON(): { latitude: number; longitude: number } {
    return { latitude: this.latitude, longitude: this.longitude };
  }

  toString(): string {
    return `(${this.latitude}, ${this.longitude})`;
  }
}
