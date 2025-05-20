// Test for math calculations and common knowledge
import { generateGeneralKnowledgeResponse } from './routes/chatbot.js';

async function testMathCalculations() {
  try {
    console.log('Testing math calculations and common knowledge...');
    
    // Test a variety of questions
    const questions = [
      "1+1",
      "2+2",
      "5*3",
      "10/2",
      "what is addition",
      "what is multiplication",
      "calculate 15 + 27",
      "what is 25 * 4",
      "hello",
      "hi there"
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
testMathCalculations(); 