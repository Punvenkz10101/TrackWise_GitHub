import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API configuration
const GEMINI_API_KEY = 'AIzaSyBuIilg9JeShKUuLekftrobmIvGt0LSRhE';
const MODEL_NAME = 'gemini-1.5-flash';

// Initialize the Generative AI client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

/**
 * Ask a question to the Gemini API using the official client library
 * @param {string} question - The user's query
 * @returns {Promise<string>} - The AI response
 */
export async function askGemini(question) {
  try {
    console.log('Calling Gemini API with official client, prompt:', question);
    
    // Generate content exactly per documentation
    const result = await model.generateContent(question);
    const response = result.response;
    const text = response.text();
    return text && text.trim() ? text : "Sorry, I couldn't find an answer to that question.";
  } catch (error) {
    console.error('Gemini API error:', error.message || error);
    throw new Error(`Failed to get response from Gemini API: ${error.message || error}`);
  }
}

export default { askGemini }; 