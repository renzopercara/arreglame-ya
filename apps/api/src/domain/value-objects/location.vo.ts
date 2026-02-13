/**
 * Location Value Object
 * Immutable representation of geographic coordinates
 */
export class Location {
  private constructor(
    public readonly latitude: number,
    public readonly longitude: number,
  ) {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Invalid latitude: must be between -90 and 90');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Invalid longitude: must be between -180 and 180');
    }
  }

  static from(latitude: number, longitude: number): Location {
    return new Location(latitude, longitude);
  }

  /**
   * Calculate distance to another location using Haversine formula
   * @returns Distance in meters
   */
  distanceTo(other: Location): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (this.latitude * Math.PI) / 180;
    const φ2 = (other.latitude * Math.PI) / 180;
    const Δφ = ((other.latitude - this.latitude) * Math.PI) / 180;
    const Δλ = ((other.longitude - this.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check if location is within radius of another location
   */
  isWithinRadius(other: Location, radiusMeters: number): boolean {
    return this.distanceTo(other) <= radiusMeters;
  }

  equals(other: Location): boolean {
    return (
      this.latitude === other.latitude && this.longitude === other.longitude
    );
  }

  toJSON() {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
    };
  }

  toString(): string {
    return `(${this.latitude}, ${this.longitude})`;
  }
}
