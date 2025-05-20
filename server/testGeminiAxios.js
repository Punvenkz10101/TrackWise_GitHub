// Test for Gemini API using axios
import { askGemini } from './utils/gemini.js';

async function testGeminiAPI() {
  try {
    console.log('Testing Gemini API with axios...');
    
    // Test a variety of questions
    const questions = [
      "What is NPM?",
      "Explain arrays in JavaScript",
      "How do recursive functions work?",
      "What are the best study techniques for college students?"
    ];
    
    for (const question of questions) {
      console.log(`\nTesting question: "${question}"`);
      
      try {
        const response = await askGemini(question);
        console.log('\nResponse:\n-------------------\n');
        console.log(response);
        console.log('\n-------------------\n');
      } catch (error) {
        console.error(`Failed for question "${question}":`, error.message);
      }
    }
    
    console.log('All tests completed!');
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testGeminiAPI(); 