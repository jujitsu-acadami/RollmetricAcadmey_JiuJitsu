import { GoogleGenAI, Chat } from "@google/genai";
import { Drill, PoseMetrics, AdvancedKpiType } from "../types";

// --- Configuration ---
const AI_MODEL_NAME = 'gemini-2.5-flash';
const AI_TEMPERATURE = 0.4;

let ai: GoogleGenAI | null = null;

function getAiInstance(): GoogleGenAI {
    if (!ai) {
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("Gemini API key is missing. Set GEMINI_API_KEY in your environment before starting the app.");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
}

// --- Utilities ---
function formatDrillName(drill: Drill | 'all'): string {
  if (!drill) return '';
  return drill.replace(/-/g, ' ');
}

// --- Drill-Specific Guidance ---
function getDrillSpecificGuidance(drill: Drill | 'all'): string {
    const drillGuidance: Partial<Record<Drill, string>> = {
        'side-control': "For this position, very low hipHeight is critical for applying pressure. Pay close attention to that metric.",
        'knee-on-belly': "For this position, very low hipHeight is critical for applying pressure. Pay close attention to that metric.",
        'mount': "In mount, maintaining high posture is key to controlling the opponent and preventing escapes. Focus on the posture metric.",
        'attacking-guard': "When attacking from guard, strong posture is crucial to prevent the opponent from breaking your structure. Focus on the posture metric.",
        'turtle': "In turtle, a low hipHeight and tight posture are essential for safety. Evaluate if the user is compact.",
        'bottom-side-control': "When escaping bottom side control, baseWidth (framing with knees) and explosive movements are key. Look for signs of creating space."
    };
    return drillGuidance[drill as Drill] || '';
}

function getSystemInstruction(drill: Drill | 'all', focusArea: Drill[], cueType: string): string {
    const drillName = formatDrillName(drill);
    const focusAreaNames = focusArea.map(d => formatDrillName(d)).join(', ');

    const context = focusArea.length > 1
        ? `The user is practicing a flow between these positions: [${focusAreaNames}]. Their current focus is '${drillName}'.`
        : `The user is practicing the '${drillName}' position.`;
        
    switch (cueType) {
        case 'Positional Prompts':
            return `You are a BJJ coach providing positional prompts. Based on the user's current position, '${drillName}', give a single, very short reminder or goal (under 10 words). Example: "From mount, stay heavy on the hips." or "In their guard, control posture." Do not analyze metrics.`;
        
        case 'Motivational Coaching':
            return `You are a motivational BJJ coach. You will receive the user's current intensity level. Provide a very short, encouraging phrase (under 8 words) to keep their energy up. Example: "Great pace!" or "Keep pushing!".`;

        case 'Technical Guidance':
        default:
             return `You are an expert Brazilian Jiu-Jitsu (BJJ) coach. You will receive a recent history of key pose metrics.
${context}
Your goal is to provide 1 to 3 short, actionable improvement tips (under 10 words each) based ONLY on the provided metrics trend.
- 'balance' (0-100 scale): Higher is better.
- 'posture' (0-100 scale): Higher is better (straighter spine/neck).
- 'hipHeight' (normalized): Vertical distance between hips and shoulders. Lower values mean lower hips, which is often better for pressure.
- 'baseWidth' (normalized): Horizontal distance between knees. Wider is often more stable.

Analyze the trend of metrics for the '${drillName}' position. Is the user improving, regressing, or staying the same?
If the metrics look good (e.g., balance > 90, posture > 90), provide positive reinforcement.
Do not comment on the JSON. Just give the feedback as a short sentence.`;
    }
}

/**
 * Initializes a new stateful chat session with the Gemini model.
 * @param drill The specific BJJ drill being practiced.
 * @param focusArea The user's selected list of drills for context.
 * @param cueType The type of feedback the user wants.
 * @returns A Chat instance.
 */
export function startChatSession(drill: Drill | 'all', focusArea: Drill[], cueType: string): Chat {
    const genAI = getAiInstance();
    const systemInstruction = getSystemInstruction(drill, focusArea, cueType);
    return genAI.chats.create({
        model: AI_MODEL_NAME,
        config: {
            systemInstruction: systemInstruction,
            temperature: AI_TEMPERATURE,
        },
    });
}

/**
 * Gets a streaming response of BJJ feedback from an active chat session.
 * @param chat The active Chat instance.
 * @param metricsHistory An array of recent PoseMetrics objects.
 * @param feedbackLog A set of previously given feedback to avoid repetition.
 * @param drill The current drill, to provide context for feedback.
 * @param cueType The type of cue to generate.
 * @param kpis The latest set of live KPIs.
 * @returns An async generator that yields feedback text chunks.
 */
export async function* getFeedbackStream(
    chat: Chat,
    metricsHistory: PoseMetrics[],
    feedbackLog: Set<string>,
    drill: Drill | 'all',
    cueType: string,
    kpis: AdvancedKpiType
): AsyncGenerator<string> {
    
    let userPrompt = '';
    const pastFeedbackInstruction = feedbackLog.size > 0
        ? `\nYou have already provided these tips, do not repeat them: [${Array.from(feedbackLog).join('; ')}]. Offer a new insight.`
        : '';

    switch (cueType) {
        case 'Positional Prompts':
            userPrompt = `My current position is ${formatDrillName(drill)}. Give me a positional prompt. ${pastFeedbackInstruction}`;
            break;

        case 'Motivational Coaching':
            const intensity = kpis.intensityEndurance ? kpis.intensityEndurance.toFixed(0) : 'moderate';
            userPrompt = `My intensity is ${intensity}/100. Give me a motivational phrase. ${pastFeedbackInstruction}`;
            break;

        case 'Technical Guidance':
        default:
            if (metricsHistory.length === 0) {
                yield "Analyzing pose...";
                return;
            }
            const currentMetrics = metricsHistory[0];
            if (currentMetrics.balance === null || currentMetrics.posture === null) {
                yield "Keep moving to get feedback.";
                return;
            }
            const drillGuidance = getDrillSpecificGuidance(drill);
            userPrompt = `Analyze this recent trend of pose metrics (the first in the list is the most recent): ${JSON.stringify(metricsHistory)}
${drillGuidance}
${pastFeedbackInstruction}`;
            break;
    }

    try {
        const response = await chat.sendMessageStream({ message: userPrompt });
        
        for await (const chunk of response) {
            if (chunk.text) {
                yield chunk.text;
            }
        }
    } catch (error) {
        console.error("Error getting feedback stream from Gemini:", error);
        yield "Could not get AI feedback. Check your API key.";
    }
}