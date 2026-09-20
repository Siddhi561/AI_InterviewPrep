// src/services/gemini.service.js
// Isolates the Gemini API call so tests can mock this one file.

import { GoogleGenerativeAI } from "@google/generative-ai";

const ai = new GoogleGenerativeAI(process.env.GEN_AI);

export async function generateQuestionsFromGemini(prompt) {
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
