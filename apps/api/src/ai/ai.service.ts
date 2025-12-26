
import { Injectable } from '@nestjs/common';
import { GoogleGenAI, Type } from "@google/genai";

@Injectable()
export class AiVisionService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async estimateGardenWork(imageBase64: string, userDescription: string) {
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
          role: "user",
          parts: [
            { text: `Analiza la imagen del jardÃƒ­n y la descripciÃƒ³n: "${userDescription}". Calcula dificultad (1-2), horas y obstÃƒ¡culos visibles.` },
            { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } }
          ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            difficultyMultiplier: { type: Type.NUMBER },
            estimatedHours: { type: Type.NUMBER },
            obstacles: { type: Type.ARRAY, items: { type: Type.STRING } },
            reasoning: { type: Type.STRING }
          },
          required: ["difficultyMultiplier", "estimatedHours", "obstacles", "reasoning"]
        }
      }
    });
    return JSON.parse(response.text);
  }

  async auditJobCompletion(beforeImage: string, afterImage: string, extraEvidence: string[] = []) {
    const cleanBefore = beforeImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    const cleanAfter = afterImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    
    const evidenceParts = extraEvidence.map(img => ({
        inlineData: {
            mimeType: "image/jpeg",
            data: img.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '')
        }
    }));

    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
          role: "user",
          parts: [
            { text: "AUDITORÃƒA TÃƒâ€°CNICA: Compara la foto del ANTES con la/s foto/s del DESPUÃƒâ€°S. El pasto debe estar visiblemente mÃƒ¡s corto y el Ãƒ¡rea debe estar limpia de restos si el servicio lo incluÃƒ­a. Responde si apruebas el trabajo." },
            { inlineData: { mimeType: "image/jpeg", data: cleanBefore } },
            { inlineData: { mimeType: "image/jpeg", data: cleanAfter } },
            ...evidenceParts
          ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            approved: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING }
          },
          required: ["approved", "feedback"]
        }
      }
    });
    return JSON.parse(response.text);
  }

  /**
   * Analiza una disputa para ayudar al soporte humano.
   */
  async analyzeDispute(beforeImage: string, afterImage: string, evidence: string[], clientReason: string) {
    const cleanBefore = beforeImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    const cleanAfter = afterImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    
    const evidenceParts = evidence.map(img => ({
        inlineData: { mimeType: "image/jpeg", data: img.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '') }
    }));

    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
          role: "user",
          parts: [
            { text: `SISTEMA DE ARBITRAJE: El cliente reclama: "${clientReason}". Compara el estado inicial (ANTES) con el final (DESPUÃƒâ€°S y EVIDENCIAS). Calcula un puntaje de cumplimiento de 0 a 100 y da un veredicto sugerido.` },
            { inlineData: { mimeType: "image/jpeg", data: cleanBefore } },
            { inlineData: { mimeType: "image/jpeg", data: cleanAfter } },
            ...evidenceParts
          ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            complianceScore: { type: Type.NUMBER, description: "Probabilidad de que el trabajo estÃƒ© bien hecho (0-100)" },
            suggestedResolution: { type: Type.STRING, enum: ["FULL_REFUND", "PARTIAL_REFUND", "FULL_PAYMENT"] },
            detailedAnalysis: { type: Type.STRING }
          },
          required: ["complianceScore", "suggestedResolution", "detailedAnalysis"]
        }
      }
    });
    return JSON.parse(response.text);
  }
}
