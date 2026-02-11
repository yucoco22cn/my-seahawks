
import { GoogleGenAI } from "@google/genai";

// Safe access to API Key for browser environments
const getApiKey = () => {
  try {
    return (typeof process !== 'undefined' && process.env?.API_KEY) ? process.env.API_KEY : "";
  } catch (e) {
    return "";
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

// Local fallbacks to keep the game immersive when API limits are reached
const LOCAL_FALLBACKS: Record<string, string[]> = {
  "Touchdown scored!": [
    "TOUCHDOWN SEAHAWKS! The 12s are absolutely electric right now!",
    "TO THE HOUSE! What a magnificent play for the Blue and Action Green!",
    "Loudest fans in the league, and they've got plenty to cheer for now! TD!",
    "Seahawks find the endzone! The ground is literally shaking in Seattle!"
  ],
  "Sacked!": [
    "Sacked! The defense broke through the line like a tidal wave.",
    "Big hit! The QB is down, but the 12s are helping him back up.",
    "Turnover on downs! The defense came to play today!",
    "Rough play there, but the Seahawks spirit never wavers."
  ],
  "BIG SWING! DEFENSE RESET!": [
    "POW! A massive momentum shift for the Seahawks!",
    "The 12th Man factor is real! The defense is reeling!",
    "Absolute power move! That's how we do it in the Pacific Northwest!"
  ],
  "default": [
    "The 12s are the loudest fans in the NFL!",
    "Blue Friday every day here at the Clink!",
    "Seahawks football: Passion, Power, and Pride!",
    "Can you feel the energy? That's the 12th Man effect!"
  ]
};

let lastCallTime = 0;
let quotaCooldownUntil = 0;
const MIN_INTERVAL = 5000; // 5 seconds between AI calls to respect rate limits
const COOLDOWN_DURATION = 60000; // 1 minute cooldown if we hit a 429

/**
 * Generates dynamic Seahawks sportscaster commentary using Gemini.
 * Includes fallback logic to handle 429 Resource Exhausted errors.
 */
export const getCommentary = async (event: string, athleteName: string) => {
  const now = Date.now();
  const eventKey = Object.keys(LOCAL_FALLBACKS).find(k => event.includes(k)) || "default";
  const fallbacks = LOCAL_FALLBACKS[eventKey];
  const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];

  // 1. Check if we are in a quota cooldown period
  if (now < quotaCooldownUntil) {
    console.warn("Gemini API in cooldown (Quota Exhausted). Using fallback.");
    return randomFallback;
  }

  // 2. Throttle calls to prevent hitting rate limits
  if (now - lastCallTime < MIN_INTERVAL) {
    return randomFallback;
  }

  // 3. Skip if no API key is available
  if (!getApiKey()) {
    return randomFallback;
  }

  try {
    lastCallTime = now;
    // Calling gemini-3-flash-preview with a thinkingBudget of 0 to prioritize speed and avoid token consumption by reasoning
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a high-energy NFL sportscaster for the Seattle Seahawks. Give me a 1-sentence hype commentary for the following game event: "${event}" involving player "${athleteName}". Keep it exciting and specific to the Seahawks "12th Man" culture. Use words like 'The Clink', 'Action Green', or 'Loudest Fans'.`,
      config: {
        maxOutputTokens: 100,
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.9,
      }
    });

    return response.text?.trim() || randomFallback;
  } catch (error: any) {
    // 4. Handle 429 specifically
    if (error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      console.error("Gemini Quota Exhausted (429). Entering 60s cooldown.");
      quotaCooldownUntil = now + COOLDOWN_DURATION;
    } else {
      console.error("Gemini Error:", error);
    }
    
    return randomFallback;
  }
};
