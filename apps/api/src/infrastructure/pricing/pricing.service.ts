import { Injectable, Logger } from '@nestjs/common';
import { GeminiPricingEngine } from './gemini-pricing.service';
import { RuleBasedPricingEngine } from './rule-based-pricing.service';
import { IPricingEngine } from './pricing-engine.interface';
import { AiEstimation } from '../../domain/value-objects/ai-estimation.vo';

/**
 * Pricing Service with Fallback Strategy
 * Tries Gemini first, falls back to rule-based if unavailable
 */
@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    private readonly geminiEngine: GeminiPricingEngine,
    private readonly ruleBasedEngine: RuleBasedPricingEngine,
  ) {}

  /**
   * Estimate price with automatic fallback
   */
  async estimatePrice(
    imageBase64: string,
    description: string,
    squareMeters: number,
  ): Promise<AiEstimation> {
    let engine: IPricingEngine = this.geminiEngine;

    // Try Gemini first
    if (await this.geminiEngine.isAvailable()) {
      try {
        this.logger.log('Using Gemini AI for pricing estimation');
        return await this.geminiEngine.estimatePrice(
          imageBase64,
          description,
          squareMeters,
        );
      } catch (error) {
        this.logger.warn(
          `Gemini pricing failed: ${error.message}, falling back to rule-based`,
        );
        engine = this.ruleBasedEngine;
      }
    } else {
      this.logger.log(
        'Gemini unavailable, using rule-based pricing',
      );
      engine = this.ruleBasedEngine;
    }

    // Fallback to rule-based
    return await engine.estimatePrice(imageBase64, description, squareMeters);
  }

  /**
   * Force rule-based estimation (for testing or when AI is explicitly disabled)
   */
  async estimatePriceRuleBased(
    imageBase64: string,
    description: string,
    squareMeters: number,
  ): Promise<AiEstimation> {
    this.logger.log('Using rule-based estimation (forced)');
    return await this.ruleBasedEngine.estimatePrice(
      imageBase64,
      description,
      squareMeters,
    );
  }

  /**
   * Get current pricing engine status
   */
  async getEngineStatus(): Promise<{
    gemini: boolean;
    ruleBased: boolean;
    activeEngine: string;
  }> {
    const geminiAvailable = await this.geminiEngine.isAvailable();
    const ruleBasedAvailable = await this.ruleBasedEngine.isAvailable();

    return {
      gemini: geminiAvailable,
      ruleBased: ruleBasedAvailable,
      activeEngine: geminiAvailable
        ? this.geminiEngine.getName()
        : this.ruleBasedEngine.getName(),
    };
  }
}
