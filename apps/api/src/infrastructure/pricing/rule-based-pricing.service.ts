import { Injectable, Logger } from '@nestjs/common';
import { IPricingEngine } from './pricing-engine.interface';
import { AiEstimation } from '../../domain/value-objects/ai-estimation.vo';

/**
 * Rule-Based Pricing Engine
 * Fallback pricing strategy using predefined business rules
 */
@Injectable()
export class RuleBasedPricingEngine implements IPricingEngine {
  private readonly logger = new Logger(RuleBasedPricingEngine.name);

  // Configurable pricing rules
  private readonly baseRatePerM2 = 150; // ARS per m²
  private readonly hourlyRate = 2000; // ARS per hour
  private readonly defaultHoursPerM2 = 0.05; // 5 hours per 100m²

  async estimatePrice(
    imageBase64: string,
    description: string,
    squareMeters: number,
  ): Promise<AiEstimation> {
    this.logger.log(
      `Using rule-based estimation for ${squareMeters}m²`,
    );

    // Calculate difficulty score based on keywords in description
    const difficultyScore = this.calculateDifficultyFromDescription(description);

    // Estimate hours based on area and difficulty
    const baseHours = squareMeters * this.defaultHoursPerM2;
    const difficultyMultiplier = 1 + difficultyScore / 10;
    const estimatedHours = Math.max(1, baseHours * difficultyMultiplier);

    // Calculate price
    const areaBasedPrice = squareMeters * this.baseRatePerM2;
    const timeBasedPrice = estimatedHours * this.hourlyRate;
    const suggestedBasePrice = Math.max(areaBasedPrice, timeBasedPrice);

    const obstacles = this.extractObstacles(description);
    const reasoning = this.generateReasoning(
      squareMeters,
      difficultyScore,
      estimatedHours,
      obstacles,
    );

    return AiEstimation.from({
      estimatedM2: squareMeters,
      difficultyScore,
      estimatedHours: Math.round(estimatedHours * 10) / 10, // Round to 1 decimal
      suggestedBasePrice: Math.round(suggestedBasePrice),
      obstacles,
      reasoning,
    });
  }

  async isAvailable(): Promise<boolean> {
    // Rule-based engine is always available
    return true;
  }

  getName(): string {
    return 'RuleBasedPricingEngine';
  }

  /**
   * Calculate difficulty score from description keywords
   */
  private calculateDifficultyFromDescription(description: string): number {
    const lowerDesc = description.toLowerCase();
    let score = 5; // Default medium difficulty

    // Difficulty indicators
    const difficultyKeywords = {
      easy: ['simple', 'pequeño', 'fácil', 'básico', 'mantenimiento'],
      hard: [
        'grande',
        'difícil',
        'complejo',
        'maleza',
        'terreno irregular',
        'árboles',
        'obstáculos',
        'desnivel',
        'piedras',
      ],
    };

    // Reduce score for easy indicators
    for (const keyword of difficultyKeywords.easy) {
      if (lowerDesc.includes(keyword)) {
        score -= 1;
      }
    }

    // Increase score for hard indicators
    for (const keyword of difficultyKeywords.hard) {
      if (lowerDesc.includes(keyword)) {
        score += 1.5;
      }
    }

    // Clamp between 1 and 10
    return Math.max(1, Math.min(10, score));
  }

  /**
   * Extract potential obstacles from description
   */
  private extractObstacles(description: string): string[] {
    const lowerDesc = description.toLowerCase();
    const obstacles: string[] = [];

    const obstacleKeywords = [
      { keyword: 'maleza', label: 'Maleza alta' },
      { keyword: 'árboles', label: 'Árboles que podar' },
      { keyword: 'piedras', label: 'Terreno con piedras' },
      { keyword: 'desnivel', label: 'Terreno irregular' },
      { keyword: 'irregular', label: 'Terreno irregular' },
      { keyword: 'grande', label: 'Área extensa' },
      { keyword: 'obstáculos', label: 'Múltiples obstáculos' },
    ];

    for (const { keyword, label } of obstacleKeywords) {
      if (lowerDesc.includes(keyword) && !obstacles.includes(label)) {
        obstacles.push(label);
      }
    }

    if (obstacles.length === 0) {
      obstacles.push('Sin obstáculos significativos identificados');
    }

    return obstacles;
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    squareMeters: number,
    difficultyScore: number,
    estimatedHours: number,
    obstacles: string[],
  ): string {
    const difficulty =
      difficultyScore < 4
        ? 'baja'
        : difficultyScore < 7
          ? 'media'
          : 'alta';

    return `Estimación basada en reglas: Área de ${squareMeters}m² con dificultad ${difficulty}. ` +
      `Se estiman ${estimatedHours.toFixed(1)} horas de trabajo. ` +
      `Obstáculos detectados: ${obstacles.join(', ')}.`;
  }
}
