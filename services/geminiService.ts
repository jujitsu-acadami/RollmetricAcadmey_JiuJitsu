import { GoogleGenAI } from "@google/genai";

// Ensure the API key is available in the environment variables
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const systemInstruction = `You are an expert Brazilian Jiu-Jitsu (BJJ) coach. Your student is practicing the 'Side Control' position.
You will be given a JSON object containing the 3D coordinates of their pose landmarks, detected by a camera.
Your task is to analyze these landmarks and provide one single, concise, and actionable piece of feedback to help them improve their form.
Keep the feedback under 10 words. Focus on common mistakes in side control: posture being too high, base being too narrow, hips being too high, or head position.
Do not comment on the JSON data. Only provide the coaching feedback.
For example: "Lower your hips for more pressure," "Widen your knees for a better base," or "Keep your head down."
If the pose looks good, tell them: "Excellent form, maintain pressure."`;

/**
 * Analyzes pose landmarks using Gemini AI to provide BJJ feedback.
 * @param landmarks - An array of pose landmarks from MediaPipe.
 * @returns A promise that resolves to a string containing feedback.
 */
export async function getPoseFeedback(landmarks: any[]): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this pose for BJJ Side Control: ${JSON.stringify(landmarks)}`,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });
    
    // Using the .text property for direct access to the generated text
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
