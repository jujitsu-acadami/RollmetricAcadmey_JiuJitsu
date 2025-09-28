import { GoogleGenAI } from "@google/genai";
import { Drill } from "../types";

// Fix: Initialize GoogleGenAI directly with the environment variable as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstructions: Partial<Record<Drill, string>> = {
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

  'back-control': `You are an expert BJJ coach analyzing the 'Back Control' position. Your goal is to provide one actionable tip under 10 words.
  
Key points for Back Control:
1.  **Seatbelt Grip:** One arm over the shoulder, one under the armpit. Are the hands connected? Feedback: "Connect your hands." or "Secure the seatbelt."
2.  **Heel Pressure:** Heels (landmarks 29, 30) should be digging into the opponent's thighs. Are the legs passive? Feedback: "Heels to thighs." or "Activate your hooks."
3.  **Head Position:** Head should be tight to the opponent's head to control posture. Is there space? Feedback: "Head tight to their head." or "Control their posture."
  
If form is good, say: "Strong back control."`,

  'knee-on-belly': `You are an expert BJJ coach analyzing the 'Knee-on-Belly' position. Provide one actionable tip under 10 words.
  
Key points for Knee-on-Belly:
1.  **Knee Placement:** The knee (25 or 26) should be on the stomach/solar plexus, not the chest or hips. Feedback: "Knee on the stomach."
2.  **Posture:** Torso should be upright. Is the student leaning too far forward? Feedback: "Posture up, stay tall."
3.  **Base:** The non-posted leg (foot 31 or 32) should be out wide for base. Is the base too narrow? Feedback: "Widen your posting leg."
  
If form is good, say: "Great pressure."`,
};


/**
 * Analyzes pose landmarks using Gemini AI to provide BJJ feedback.
 * @param landmarks - An array of pose landmarks from MediaPipe.
 * @param drill - The specific BJJ drill being practiced.
 * @param focusArea - The full list of drills the user is focusing on.
 * @returns A promise that resolves to a string containing feedback.
 */
export async function getPoseFeedback(landmarks: any[], drill: Drill, focusArea: Drill[]): Promise<string> {
  const drillName = drill.replace(/-/g, ' ');
  let systemInstruction: string;

  // If focus area is small or just the current drill, use the specialized prompt
  if (focusArea.length <= 1) {
    systemInstruction = systemInstructions[drill] || 
      `You are an expert BJJ coach observing a student in the '${drillName}' position. Analyze their posture, base, and alignment based on the provided landmarks. Give one short, actionable tip under 10 words. If the form looks good, say "Solid position."`;
  } else {
    // Build the new, context-aware prompt
    const focusAreaNames = focusArea.map(d => d.replace(/-/g, ' ')).join(', ');
    systemInstruction = `You are an expert Brazilian Jiu-Jitsu (BJJ) coach. The user is practicing a flow between these positions: [${focusAreaNames}]. 
    Your primary goal is to analyze the provided pose landmarks and give one specific, actionable tip (under 10 words) for the most likely current position, which is '${drillName}'.
    
    Analyze the form for '${drillName}', but also consider the context of the other positions. Is their posture ready for a transition? Is their base solid enough to move to another position in their focus area?
    
    Example feedback:
    - For form correction: "Lower your hips.", "Widen your base.", "Posture up."
    - For transitional awareness: "Good pressure, prepare for mount." or "Control the hips to prevent guard recovery."
    
    Do not comment on the JSON. If the form looks solid and ready for transitions, provide positive reinforcement like: "Excellent control and pressure." or "Solid transition-ready posture."`;
  }


  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `The student is currently focused on the '${drillName}' position within a larger training context. Analyze this pose: ${JSON.stringify(landmarks)}`,
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