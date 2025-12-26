
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const auditJobCompletion = async (beforeImage: string, afterImage: string): Promise<{ approved: boolean; confidence: number; feedback: string }> => {
    try {
        const base64Before = beforeImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
        const base64After = afterImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
                parts: [
                    { text: `SOS UN AUDITOR DE SERVICIOS DE JARDINERÃƒÂA EN ARGENTINA. 
                    ComparÃƒÂ¡ estas dos imÃƒÂ¡genes. 
                    REGLAS DE SEGURIDAD:
                    1. Si las imÃƒÂ¡genes son idÃƒÂ©nticas, RECHAZÃƒÂ (Fraude).
                    2. Si el pasto no estÃƒÂ¡ visiblemente mÃƒÂ¡s corto o prolijo, RECHAZÃƒÂ.
                    3. IgnorÃƒÂ¡ cambios en la luz del sol, pero validÃƒÂ¡ que los objetos fijos (paredes, ÃƒÂ¡rboles) coincidan para asegurar que es el mismo lugar.
                    4. RespondÃƒÂ© en JSON.` },
                    { inlineData: { mimeType: "image/jpeg", data: base64Before } },
                    { inlineData: { mimeType: "image/jpeg", data: base64After } }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        approved: { type: Type.BOOLEAN },
                        confidence: { type: Type.NUMBER, description: "0.0 to 1.0" },
                        feedback: { type: Type.STRING, description: "ExplicaciÃƒÂ³n en espaÃƒÂ±ol rioplatense" }
                    },
                    required: ["approved", "confidence", "feedback"]
                }
            }
        });

        return JSON.parse(response.text);
    } catch (e) {
        return { approved: false, confidence: 0, feedback: "Error en la auditorÃƒÂ­a visual automÃƒÂ¡tica." };
    }
}
