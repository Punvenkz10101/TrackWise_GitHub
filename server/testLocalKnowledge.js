// Test for local knowledge base fallback
import { generateGeneralKnowledgeResponse } from './routes/chatbot.js';

async function testLocalKnowledge() {
  try {
    console.log('Testing local knowledge base fallback...');
    
    // Test a variety of questions
    const questions = [
      "What is NPM?",
      "Explain arrays in JavaScript",
      "How do recursive functions work?",
      "What are some good study techniques?",
      "Tell me about MongoDB",
      "What is an API?"
    ];
    
    for (const question of questions) {
      console.log(`\nTesting question: "${question}"`);
      
      const response = generateGeneralKnowledgeResponse(question);
      console.log('\nResponse:\n-------------------\n');
      console.log(response);
      console.log('\n-------------------\n');
    }
    
    console.log('All tests completed!');
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testLocalKnowledge(); 