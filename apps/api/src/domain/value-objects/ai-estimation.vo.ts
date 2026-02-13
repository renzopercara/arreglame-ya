/**
 * AiEstimation Value Object
 * Immutable AI analysis result for pricing
 */
export interface AiEstimationData {
  estimatedM2?: number;
  difficultyScore: number;
  estimatedHours: number;
  suggestedBasePrice: number;
  obstacles?: string[];
  reasoning?: string;
}

export class AiEstimation {
  constructor(
    public readonly estimatedM2: number | undefined,
    public readonly difficultyScore: number,
    public readonly estimatedHours: number,
    public readonly suggestedBasePrice: number,
    public readonly obstacles: string[] = [],
    public readonly reasoning: string = '',
  ) {
    if (difficultyScore < 0 || difficultyScore > 10) {
      throw new Error('Difficulty score must be between 0 and 10');
    }
    if (estimatedHours <= 0) {
      throw new Error('Estimated hours must be positive');
    }
    if (suggestedBasePrice < 0) {
      throw new Error('Suggested base price cannot be negative');
    }
  }

  static from(data: AiEstimationData): AiEstimation {
    return new AiEstimation(
      data.estimatedM2,
      data.difficultyScore,
      data.estimatedHours,
      data.suggestedBasePrice,
      data.obstacles,
      data.reasoning,
    );
  }

  toJSON() {
    return {
      estimatedM2: this.estimatedM2,
      difficultyScore: this.difficultyScore,
      estimatedHours: this.estimatedHours,
      suggestedBasePrice: this.suggestedBasePrice,
      obstacles: this.obstacles,
      reasoning: this.reasoning,
    };
  }
}
