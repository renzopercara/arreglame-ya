/**
 * AssignmentScore Value Object
 * Score for worker assignment prioritization
 */
export class AssignmentScore {
  constructor(
    public readonly distanceScore: number,
    public readonly ratingScore: number,
    public readonly totalScore: number,
    public readonly distanceMeters: number,
  ) {
    if (distanceScore < 0 || ratingScore < 0) {
      throw new Error('Scores cannot be negative');
    }
  }

  static calculate(
    distanceMeters: number,
    maxDistanceMeters: number,
    rating: number,
    maxRating: number = 5,
  ): AssignmentScore {
    // Distance component: 40% weight
    const distanceNormalized = Math.max(
      0,
      1 - distanceMeters / maxDistanceMeters,
    );
    const distanceScore = distanceNormalized * 0.4;

    // Rating component: 60% weight
    const ratingNormalized = rating / maxRating;
    const ratingScore = ratingNormalized * 0.6;

    const totalScore = distanceScore + ratingScore;

    return new AssignmentScore(
      distanceScore,
      ratingScore,
      totalScore,
      distanceMeters,
    );
  }

  isHigherThan(other: AssignmentScore): boolean {
    return this.totalScore > other.totalScore;
  }

  toJSON() {
    return {
      distanceScore: this.distanceScore,
      ratingScore: this.ratingScore,
      totalScore: this.totalScore,
      distanceMeters: this.distanceMeters,
    };
  }
}
