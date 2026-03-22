
import { GoogleGenAI, Type, GenerateContentResponse, ThinkingLevel } from "@google/genai";
import { VastuResult } from "../types";

const SYSTEM_PROMPT = `Lead Vastu AI Expert. Analyze floor plans with speed/precision.
CRITICAL: If the image is NOT a clear architectural floor plan, blueprint, or layout, IMMEDIATELY return { "isValidFloorPlan": false, "validationError": "Detailed reason why it failed validation" }.
1. VALIDATE: Floor plan/blueprint?
2. MULTI-UNIT: Check for multiple flats/units. If detected on first pass, return multipleUnitsDetected:true and list them in detectedUnits.
3. ORIENTATION: Find North (N-arrow, compass).
4. AUDIT: Detect all rooms (Kitchen, Entrance, Living, Bedroom, Toilet, Balcony, Pooja, Open Space).
5. VASTU: Identify Zone (N, NE, E, SE, S, SW, W, NW), Compliance, and Remedy.
6. VERDICT: Overall Vedic Verdict (EXCELLENT to CRITICAL).
7. FURNITURE: Identify major items and zonal compliance.
8. GEOMETRY: Identify shapeType and layoutComplexity.
9. Output valid JSON matching schema.`;

/**
 * Helper to call Gemini API with exponential backoff retry for 429 errors.
 */
async function callGeminiWithRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 2000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const errorMsg = err?.message || "";
      
      // Identify retryable errors: Quota (429), Server Errors (5xx), and Transient Network issues
      const isRetryable = 
        errorMsg.includes('429') || 
        errorMsg.includes('500') || 
        errorMsg.includes('502') || 
        errorMsg.includes('503') || 
        errorMsg.includes('504') || 
        errorMsg.includes('RESOURCE_EXHAUSTED') || 
        errorMsg.includes('quota') ||
        errorMsg.includes('fetch failed') ||
        errorMsg.includes('network') ||
        errorMsg.includes('timeout');
      
      if (isRetryable && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i) + (Math.random() * 1000); // Add jitter
        console.warn(`AlignHome.ai: Transient error detected ("${errorMsg}"). Retrying attempt ${i + 1} in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Non-retryable or final attempt reached
      if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
        throw new Error("Our AI servers are currently busy due to high demand. Please try again in a few moments.");
      }

      if (errorMsg.includes('API key not valid')) {
        throw new Error("System configuration error: API key is invalid. Please contact support.");
      }

      if (errorMsg.includes('safety')) {
        throw new Error("The image could not be processed due to safety filters. Please ensure you are uploading a standard architectural floor plan.");
      }

      throw new Error(`Analysis Error: ${errorMsg || "An unexpected error occurred during Vastu analysis."}`);
    }
  }
  throw lastError;
}

export const analyzeFloorPlan = async (base64Image: string, selectedUnit?: string, signal?: AbortSignal, skipSymbol = false): Promise<VastuResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const userContext = selectedUnit 
    ? `UNIT AUDIT: Focus exclusively on the unit labeled "${selectedUnit}". 
       1. Locate this specific unit within the floor plan.
       2. Use the North mark from the overall plan for orientation.
       3. Identify all rooms and furniture within this unit.
       4. Perform 16-zone Vastu audit for this unit only.
       Do NOT return multipleUnitsDetected: true.` 
    : "INITIAL SCAN: Detect all units and the North direction. If multiple units exist, list them in 'detectedUnits'.";

  const analysisParams = {
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: `${userContext} Provide a high-speed, precise Vastu analysis in JSON format.` },
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
      ]
    },
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isValidFloorPlan: { type: Type.BOOLEAN },
          multipleUnitsDetected: { type: Type.BOOLEAN },
          detectedUnits: { type: Type.ARRAY, items: { type: Type.STRING } },
          validationError: { type: Type.STRING },
          shapeType: { 
            type: Type.STRING, 
            description: "The geometric shape of the floor plan boundary.",
            enum: ["RECTANGULAR", "SQUARE", "L_SHAPED", "U_SHAPED", "IRREGULAR", "CIRCULAR"]
          },
          layoutComplexity: {
            type: Type.STRING,
            description: "The architectural density and complexity of the plan.",
            enum: ["SIMPLE", "MODERATE", "COMPLEX", "EXTREME"]
          },
          score: { type: Type.NUMBER },
          projectedScore: { type: Type.NUMBER, description: "Estimated score after implementing all remedies." },
          scannedElementsCount: { type: Type.NUMBER, description: "Total architectural elements identified." },
          status: { type: Type.STRING },
          verdict: { 
            type: Type.STRING,
            description: "A clear final verdict on the Vastu compliance.",
            enum: ["EXCELLENT", "GOOD", "AVERAGE", "POOR", "CRITICAL"]
          },
          verdictDescription: { type: Type.STRING, description: "Detailed reasoning for the verdict." },
          inferredNorth: { type: Type.STRING },
          inferredNorthDescription: { type: Type.STRING },
          complianceTable: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                area: { type: Type.STRING },
                currentZone: { type: Type.STRING },
                status: { type: Type.STRING },
                idealZone: { type: Type.STRING }
              }
            }
          },
          remedyObjects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                conflict: { type: Type.STRING },
                remedy: { type: Type.STRING },
                impact: { type: Type.STRING }
              }
            }
          },
          roomDetections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                box2d: { 
                  type: Type.ARRAY, 
                  items: { type: Type.NUMBER }
                }
              }
            }
          },
          furnitureDetections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                box2d: { 
                  type: Type.ARRAY, 
                  items: { type: Type.NUMBER }
                },
                zone: { type: Type.STRING },
                isCompliant: { type: Type.BOOLEAN },
                remedy: { type: Type.STRING },
                message: { type: Type.STRING }
              }
            }
          }
        },
        required: ["isValidFloorPlan", "multipleUnitsDetected"]
      }
    }
  };

  // Start both tasks in parallel for maximum speed in valid cases
  const analysisTask = callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent(analysisParams));
  
  let symbolTask: Promise<GenerateContentResponse | null> = Promise.resolve(null);
  if (!skipSymbol) {
    const symbolPrompt = "Sacred Hindu Yantra, gold line art on white, minimalist architectural style.";
    symbolTask = callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: symbolPrompt }] }
    })).catch(e => {
      console.warn("Symbol generation failed, skipping.");
      return null;
    });
  }

  // FAIL-FAST: Wait for analysis first. If it's invalid, return immediately without waiting for symbol.
  const response = await analysisTask;
  const text = response.text;
  if (!text) throw new Error("Vedic analysis failed.");
  const data = JSON.parse(text);

  if (!data.isValidFloorPlan) {
    return data;
  }

  // If valid, wait for the symbol (which was already running in parallel)
  if (!skipSymbol) {
    const imgRes = await symbolTask;
    if (imgRes) {
      const imgPart = imgRes.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (imgPart?.inlineData) data.generatedSymbolUrl = `data:image/png;base64,${imgPart.inlineData.data}`;
    }
  }

  return data;
};
