
import { GoogleGenAI } from "@google/genai";
import { PRODUCTS } from "../constants";

// Initialize GoogleGenAI with the API key from environment variables as per guidelines.
// The key is assumed to be valid and pre-configured.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getShoppingAdvice = async (userQuery: string): Promise<string> => {
  const productContext = PRODUCTS.map(p => 
    `- ${p.name} (${p.category}): KD ${p.discountPrice || p.price}`
  ).join('\n');

  const systemInstruction = `You are a helpful sales assistant for NSTORE.ONLINE, a multi-vendor e-commerce platform in Kuwait.
  Currency is KD (Kuwaiti Dinar).
  
  Here is a list of our current key products:
  ${productContext}
  
  Your goal is to recommend products from this list if they match the user's needs. 
  Keep responses short, friendly, and sales-oriented.
  `;

  try {
    // Directly call generateContent using the initialized ai client and model name.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userQuery,
      config: {
        systemInstruction: systemInstruction,
        // Removed maxOutputTokens to follow guidelines regarding avoiding token blocking and proper thinking budget management.
      }
    });

    // Access the .text property directly.
    return response.text || "I couldn't find a specific answer, but feel free to browse our categories!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble connecting to the brain right now. Please try searching manually.";
  }
};