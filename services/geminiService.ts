
import { GoogleGenAI } from "@google/genai";
import { PRODUCTS } from "../constants";

export const getShoppingAdvice = async (userQuery: string): Promise<string> => {
  // Always initialize GoogleGenAI with a named parameter using process.env.API_KEY directly.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    // Correctly calling generateContent with the model name and required parameters.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userQuery,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    // Access the .text property directly from the response object.
    return response.text || "I couldn't find a specific answer, but feel free to browse our categories!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble connecting to the brain right now. Please try searching manually.";
  }
};
