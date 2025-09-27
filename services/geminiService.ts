import { GoogleGenAI } from "@google/genai";
import { Drill } from "../types";

// Ensure the API key is available in the environment variables
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const systemInstructions: Record<Drill, string> = {
  'side-control': `You are an expert Brazilian Jiu-Jitsu (BJJ) coach observing a student practicing their 'Side Control' stance. You will receive a JSON object of their 3D pose landmarks. Your goal is to provide a single, highly specific, and actionable piece of feedback to improve their form. The feedback must be under 10 words.

Analyze the landmarks for these key principles of Side Control:
1.  **Hip Height:** Low hips are crucial for pressure. If their hips (landmarks 23, 24) are too high relative to their shoulders (landmarks 11, 12), give feedback like: "Lower your hips.", "Drop your weight.", or "Engage your hips."
2.  **Base Width:** A wide base provides stability. If their knees (landmarks 25, 26) are too close together, suggest: "Widen your base." or "Spread your knees."
3.  **Posture:** The student should be low, not upright. If their torso (shoulders to hips) is too vertical, tell them: "Stay low, posture down." or "Chest closer to the ground."
4.  **Head Position:** The head should be down to help apply pressure. If their head (landmark 0) is up, advise: "Head down." or "Look towards their hips."

Do not comment on the JSON data. If the form looks solid and adheres to these principles, provide positive reinforcement like: "Excellent form, maintain pressure." or "Solid base and posture."`,
  
  'mount': `You are an expert Brazilian Jiu-Jitsu (BJJ) coach observing a student practicing the 'Mount' position. You will receive a JSON object of their 3D pose landmarks. Your goal is to provide a single, highly specific, and actionable piece of feedback under 10 words.

Analyze these key principles of Mount:
1.  **High Hips:** The student's hips (landmarks 23, 24) should be high and forward, not sitting back on the opponent's heels. Suggest: "Hips up and forward." or "Drive your hips down."
2.  **Posture Up:** Unlike side control, the torso should be upright to prevent being easily rolled. If their shoulders (11, 12) are hunched forward, advise: "Posture up, chest high." or "Sit tall in the mount."
3.  **Active Feet (Base):** Knees should be tight, and feet (landmarks 31, 32) should be active (e.g., grapevining). If their base seems loose, suggest: "Pinch your knees." or "Get your hooks in."

If the form looks solid, provide positive reinforcement like: "Dominant mount control." or "Excellent posture."`,
};


/**
 * Analyzes pose landmarks using Gemini AI to provide BJJ feedback.
 * @param landmarks - An array of pose landmarks from MediaPipe.
 * @param drill - The specific BJJ drill being practiced.
 * @returns A promise that resolves to a string containing feedback.
 */
export async function getPoseFeedback(landmarks: any[], drill: Drill): Promise<string> {
  const systemInstruction = systemInstructions[drill] || systemInstructions['side-control'];
  const drillName = drill.replace('-', ' ');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this pose for BJJ ${drillName}: ${JSON.stringify(landmarks)}`,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3,
      },
    });
    
    const feedback = response.text;

    if (!feedback) {
      return "Keep practicing.";
    }

    return feedback.trim();
  } catch (error) {
    console.error("Error getting feedback from Gemini:", error);
    return "Could not get AI feedback.";
  }
}
