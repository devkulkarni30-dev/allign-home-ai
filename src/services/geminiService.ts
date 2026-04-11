import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 3, baseDelay = 1000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === retries - 1) throw error;
      const delay = baseDelay * Math.pow(2, i) + Math.random() * 1000;
      console.warn(`Gemini API error, retrying in ${Math.round(delay)}ms...`, error.message);
      await sleep(delay);
    }
  }
  throw new Error('Max retries reached');
}

export const detectUnits = async (imageBase64: string) => {
  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "Analyze this image. Is it a floor plan? If yes, does it contain multiple independent units or flats? List the units found with brief descriptions (e.g., 'Unit A - Top Left', 'Unit B - Bottom Right'). If only one unit, say 'Single Unit'. Return JSON." },
            { inlineData: { mimeType: "image/png", data: imageBase64.split(',')[1] } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isFloorPlan: { type: Type.BOOLEAN },
            hasMultipleUnits: { type: Type.BOOLEAN },
            units: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["isFloorPlan", "hasMultipleUnits", "units"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  });
};

export const analyzeFloorPlan = async (imageBase64: string, selectedUnit?: string) => {
  const unitInstruction = selectedUnit 
    ? `Focus ONLY on the unit described as: "${selectedUnit}". Ignore other units in the image.`
    : "Analyze the entire floor plan.";

  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: `${unitInstruction} 
            1. Identify the North (N) mark in the layout to determine directions. If no mark is found, assume North is UP.
            2. Analyze Vastu compliance for all 16 zones.
            3. Provide a current 'score' (0-100) based on existing layout.
            4. Provide a 'potentialScore' (0-100) representing the Vastu compliance percentage AFTER all suggested remedies are correctly applied.
            5. Provide a clear 'verdict' (e.g., 'This is Vaastu compliant', 'After applying remedies it will be fine', 'Major corrections needed').
            Return JSON.` },
            { inlineData: { mimeType: "image/png", data: imageBase64.split(',')[1] } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            potentialScore: { type: Type.NUMBER },
            verdict: { type: Type.STRING },
            summary: { type: Type.STRING },
            zones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  direction: { type: Type.STRING },
                  room: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ["Positive", "Neutral", "Negative"] },
                  description: { type: Type.STRING }
                },
                required: ["direction", "room", "status", "description"]
              }
            },
            remedies: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["score", "verdict", "summary", "zones", "remedies"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  });
};
