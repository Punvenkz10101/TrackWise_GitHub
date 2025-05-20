// Simple test for Gemini API
import fetch from 'node-fetch';

const GEMINI_API_KEY = 'AIzaSyBuIilg9JeShKUuLekftrobmIvGt0LSRhE';
// Try another model name format
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

async function testGeminiAPI() {
  try {
    console.log('Testing Gemini API with URL:', GEMINI_API_URL);
    
    const prompt = "What are 5 effective study techniques for college students?";
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800
        }
      })
    });
    
    console.log('Gemini API response status:', response.status);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API error:', data);
      return;
    }
    
    // Extract the AI response
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                      "No response received";
                      
    console.log('\nGemini API Response:\n-------------------\n');
    console.log(aiResponse);
    console.log('\n-------------------\n');
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testGeminiAPI(); 