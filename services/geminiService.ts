import { GoogleGenAI, Type } from "@google/genai";
import { WordPair } from "../types";

// Helper to convert File to Base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const extractVocabularyFromImage = async (
  base64Data: string, 
  mimeType: string,
  apiKey: string
): Promise<WordPair[]> => {
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: "Analyze this image. It contains a list of words, likely English words and their Chinese translations. Extract them into a clean JSON list. If there are no obvious pairs, try to identify words and generate brief Chinese meanings yourself. Ignore headers, page numbers, or irrelevant text."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING, description: "The English word" },
              meaning: { type: Type.STRING, description: "The Chinese meaning/translation" }
            },
            required: ["word", "meaning"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];

    const rawData = JSON.parse(jsonText);
    
    // Add IDs
    return rawData.map((item: any) => ({
      id: crypto.randomUUID(),
      word: item.word,
      meaning: item.meaning
    }));

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
};