import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import { IPricingEngine } from './pricing-engine.interface';
import { AiEstimation } from '../../domain/value-objects/ai-estimation.vo';

interface GeminiResponse {
  estimatedM2?: number;
  difficultyScore: number;
  estimatedHours: number;
  suggestedBasePrice: number;
  obstacles?: string[];
  reasoning?: string;
}

/**
 * Gemini AI Pricing Engine
 * Uses Google Gemini for intelligent pricing estimation
 */
@Injectable()
export class GeminiPricingEngine implements IPricingEngine {
  private readonly logger = new Logger(GeminiPricingEngine.name);
  private ai: GoogleGenAI;
  private isEnabled: boolean = false;

  constructor() {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
      this.isEnabled = true;
      this.logger.log('Gemini Pricing Engine initialized');
    } else {
      this.logger.warn(
        'Gemini API key not found - pricing engine will be unavailable',
      );
    }
  }

  async estimatePrice(
    imageBase64: string,
    description: string,
    squareMeters: number,
  ): Promise<AiEstimation> {
    if (!this.isEnabled) {
      throw new Error('Gemini API is not configured');
    }

    try {
      this.logger.log(
        `Estimating price for ${squareMeters}m² with description: ${description}`,
      );

      const cleanBase64 = imageBase64.replace(
        /^data:image\/(png|jpeg|jpg|webp);base64,/,
        '',
      );

      const prompt = `
Eres un experto en servicios de jardinería y mantenimiento del hogar.

Analiza la imagen y la descripción del cliente:
"${description}"

Área estimada: ${squareMeters} m²

Debes estimar:
1. difficultyScore (0-10): Nivel de dificultad del trabajo
2. estimatedHours: Horas estimadas necesarias
3. suggestedBasePrice: Precio base sugerido en ARS (pesos argentinos)
4. obstacles: Lista de obstáculos o complicaciones visibles
5. reasoning: Explicación breve de tu análisis

Considera:
- Estado actual del jardín/área
- Dificultad del terreno
- Obstáculos visibles
- Tiempo necesario realista
- Precios de mercado argentino
      `.trim();

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              estimatedM2: { type: Type.NUMBER },
              difficultyScore: { type: Type.NUMBER },
              estimatedHours: { type: Type.NUMBER },
              suggestedBasePrice: { type: Type.NUMBER },
              obstacles: { type: Type.ARRAY, items: { type: Type.STRING } },
              reasoning: { type: Type.STRING },
            },
            required: [
              'difficultyScore',
              'estimatedHours',
              'suggestedBasePrice',
            ],
          },
        },
      });

      const result: GeminiResponse = JSON.parse(response.text);

      this.logger.log(
        `Gemini estimation: ${result.estimatedHours}h, difficulty ${result.difficultyScore}, price ${result.suggestedBasePrice} ARS`,
      );

      return AiEstimation.from(result);
    } catch (error) {
      this.logger.error('Gemini API error', error);
      throw new Error(`Failed to get Gemini estimation: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
      // Quick health check - could add a simple API call here if needed
      return true;
    } catch {
      return false;
    }
  }

  getName(): string {
    return 'GeminiPricingEngine';
  }
}
