// Simple test for chatbot endpoint
import fetch from 'node-fetch';

// Dev token from auth context
const devToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTFkZmJmY2Y0ZTczNjM2ZWViMGJkNGIiLCJuYW1lIjoiRGV2ZWxvcG1lbnQgVXNlciIsImVtYWlsIjoiZGV2QGV4YW1wbGUuY29tIiwiZXhwIjoxNzE4NjgzMTAwfQ.dev_signature_not_valid_for_production";

async function testChatbotQuery(queryText) {
  try {
    console.log(`\nTesting chatbot query: "${queryText}"`);
    
    const queryResponse = await fetch('http://localhost:5000/api/chatbot/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${devToken}`
      },
      body: JSON.stringify({
        message: queryText
      })
    });
    
    console.log('Response status:', queryResponse.status);
    
    if (queryResponse.ok) {
      const queryData = await queryResponse.json();
      console.log('\nResponse:\n-------------------\n');
      console.log(queryData.response);
      console.log('\n-------------------\n');
      return true;
    } else {
      console.error('Query endpoint error, status:', queryResponse.status);
      try {
        const errorData = await queryResponse.text();
        console.error('Error details:', errorData);
      } catch (e) {
        console.error('Could not parse error response');
      }
      return false;
    }
  } catch (error) {
    console.error('Test error:', error);
    return false;
  }
}

async function runTests() {
  // Test the simple /test endpoint
  try {
    console.log('Testing chatbot test endpoint...');
    
    const testResponse = await fetch('http://localhost:5000/api/chatbot/test');
    console.log('Test endpoint response status:', testResponse.status);
    
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('Test endpoint response:', testData);
    } else {
      console.error('Test endpoint error, status:', testResponse.status);
      console.log('Continuing with other tests anyway...');
    }
  } catch (error) {
    console.error('Test endpoint error:', error);
    console.log('Continuing with query tests anyway...');
  }
  
  // Test personal data queries
  const personalQueries = [
    "What is today's date?",
    "What tasks do I have today?",
    "Show me my notes",
    "What's on my schedule for next week?"
  ];
  
  // Test general knowledge queries
  const generalKnowledgeQueries = [
    "What is NPM?",
    "Explain arrays in JavaScript",
    "How do recursive functions work?",
    "What are the best study techniques?",
    "Tell me about MongoDB",
    "What is an API?"
  ];
  
  console.log('\n=== Testing Personal Data Queries ===');
  for (const query of personalQueries) {
    await testChatbotQuery(query);
  }
  
  console.log('\n=== Testing General Knowledge Queries ===');
  for (const query of generalKnowledgeQueries) {
    await testChatbotQuery(query);
  }
  
  console.log('\nAll tests completed!');
}

// Run the tests
runTests(); 