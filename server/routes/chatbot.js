import express from 'express';
import auth from '../middleware/auth.js';
import Task from '../models/Task.js';
import Note from '../models/Note.js';
import Reminder from '../models/Reminder.js';
import Progress from '../models/Progress.js';
import mongoose from 'mongoose';
import { askGemini } from '../utils/gemini.js';
import ChatMessage from '../models/ChatMessage.js';

const router = express.Router();

console.log('Chatbot route initialized - using hybrid local logic + Gemini API via axios');

// Function to get user's tasks
const getUserTasks = async (userId) => {
  try {
    console.log('Fetching tasks for user:', userId);
    const tasks = await Task.find({ userId }).sort({ dueDate: 1 });
    console.log(`Found ${tasks.length} tasks`);
    return tasks;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
};

// Function to get user's notes
const getUserNotes = async (userId) => {
  try {
    console.log('Fetching notes for user:', userId);
    const notes = await Note.find({ userId }).sort({ updatedAt: -1 });
    console.log(`Found ${notes.length} notes`);
    return notes;
  } catch (error) {
    console.error('Error fetching notes:', error);
    return [];
  }
};

// Function to get user's schedule/reminders
const getUserSchedule = async (userId) => {
  try {
    console.log('Fetching schedule/reminders for user:', userId);
    
    // Check if we have a "reminders" collection
    try {
      const reminders = await Reminder.find({ userId }).sort({ date: 1 });
      console.log(`Found ${reminders.length} reminders`);
      return reminders;
    } catch (reminderError) {
      console.error('Error with Reminder model, trying to find collection name:', reminderError);
      
      // Get list of collections to troubleshoot
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name));
      
      // Check if "schedules" collection exists and try to use it
      const scheduleCollection = collections.find(c => 
        c.name.toLowerCase().includes('schedule') || 
        c.name.toLowerCase().includes('reminder')
      );
      
      if (scheduleCollection) {
        console.log(`Found possible schedule collection: ${scheduleCollection.name}`);
        // Fall back to direct collection access
        const scheduleData = await mongoose.connection.db
          .collection(scheduleCollection.name)
          .find({ userId: mongoose.Types.ObjectId(userId) })
          .sort({ date: 1 })
          .toArray();
        console.log(`Found ${scheduleData.length} schedules from direct collection access`);
        return scheduleData;
      }
      
      // If no valid collection found, return empty array
      console.log('No valid schedule/reminder collection found, returning empty array');
      return [];
    }
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return [];
  }
};

// Function to get user's progress
const getUserProgress = async (userId) => {
  try {
    console.log('Fetching progress for user:', userId);
    const progress = await Progress.find({ userId }).sort({ date: -1 }).limit(10);
    console.log(`Found ${progress.length} progress entries`);
    return progress;
  } catch (error) {
    console.error('Error fetching progress:', error);
    return [];
  }
};

// Function to determine if a query is related to personal data or general knowledge
const isPersonalDataQuery = (message) => {
  const lower = message.toLowerCase();
  // Match if the message contains or is exactly any personal data type
  return (
    /\b(note|notes|task|tasks|schedule|reminder|reminders|event|events|progress|todo|to-do|calendar)\b/.test(lower)
  );
};

// Helper function to log debug info
const logDebug = (text) => {
  console.log(`[Chatbot Debug] ${text}`);
};

// Simple route to verify chatbot is accessible
router.get('/test', (req, res) => {
  res.json({ message: 'Chatbot route is working properly!' });
});

// Function to generate a local fallback response for general knowledge questions
export const generateGeneralKnowledgeResponse = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Knowledge base of common programming/computing topics
  const knowledgeBase = {
    "npm": "NPM (Node Package Manager) is the default package manager for Node.js. It consists of a command-line client and an online database of packages called the npm registry. It allows developers to install, share, and manage dependencies in JavaScript projects.",
    
    "array": "Arrays in programming are data structures that store multiple values in a single variable. They can hold items of the same data type (in typed languages) or different types (in dynamically typed languages). Arrays are indexed, typically starting at 0, allowing individual elements to be accessed by their position.",
    
    "javascript": "JavaScript is a high-level, interpreted programming language that conforms to the ECMAScript specification. It's commonly used for web development to create interactive elements on websites. JavaScript can run on both client-side (in browsers) and server-side (with Node.js).",
    
    "html": "HTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser. It defines the structure and content of web pages using a series of elements or tags that enclose different parts of the content.",
    
    "css": "CSS (Cascading Style Sheets) is a style sheet language used for describing the presentation of a document written in HTML. CSS describes how elements should be rendered on screen, on paper, in speech, or on other media.",
    
    "database": "A database is an organized collection of data stored and accessed electronically. Databases are designed to offer an efficient way to store, retrieve, and manage data. Common types include relational databases (like MySQL, PostgreSQL), NoSQL databases (like MongoDB, Cassandra), and more.",
    
    "mongodb": "MongoDB is a source-available cross-platform document-oriented database program. Classified as a NoSQL database, MongoDB uses JSON-like documents with optional schemas. It's known for its flexibility, scalability, and performance in handling large volumes of data.",
    
    "algorithm": "An algorithm is a step-by-step procedure or formula for solving a problem or accomplishing a task. In computing, algorithms are unambiguous specifications for performing calculations, data processing, automated reasoning, and other tasks.",
    
    "data structure": "A data structure is a specialized format for organizing, processing, retrieving, and storing data. Some common data structures include arrays, linked lists, stacks, queues, trees, and graphs.",
    
    "function": "In programming, a function is a block of organized, reusable code that performs a specific task. Functions help programmers write modular code and follow the DRY (Don't Repeat Yourself) principle.",
    
    "recursion": "Recursion in programming is when a function calls itself directly or indirectly to solve a problem. A recursive function has a base case (stopping condition) and a recursive case. It's useful for problems that can be broken down into simpler versions of the same problem.",
    
    "api": "API (Application Programming Interface) is a set of definitions and protocols for building and integrating application software. It specifies how software components should interact and allows different systems to communicate with each other.",
    
    "rest": "REST (Representational State Transfer) is an architectural style for designing networked applications. RESTful services use HTTP methods (GET, POST, PUT, DELETE) to perform operations on resources, which are identified by URLs.",
    
    "react": "React is a JavaScript library for building user interfaces, particularly single-page applications. Developed by Facebook, it allows developers to create reusable UI components and efficiently update and render components when data changes.",
    
    "node": "Node.js is an open-source, cross-platform JavaScript runtime environment that executes JavaScript code outside a web browser. It allows developers to use JavaScript for server-side scripting and to create web applications.",
    
    "express": "Express.js is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. It's a de facto standard server framework for Node.js.",
    
    "http": "HTTP (HyperText Transfer Protocol) is an application-layer protocol for transmitting hypermedia documents, such as HTML. It's the foundation of data communication on the World Wide Web.",
    
    "git": "Git is a distributed version control system designed to handle everything from small to very large projects with speed and efficiency. It allows multiple developers to work on a project simultaneously without overwriting each other's changes.",
    
    "python": "Python is a high-level, interpreted programming language known for its readability and simplicity. It supports multiple programming paradigms and has a comprehensive standard library, making it popular for web development, data analysis, AI, and more."
  };
  
  // Add basic math knowledge
  const mathOperations = {
    "addition": "Addition is a mathematical operation that represents combining collections of objects together into a larger collection. It is signified by the plus sign (+).",
    "subtraction": "Subtraction is a mathematical operation that represents removing objects from a collection. It is signified by the minus sign (-).",
    "multiplication": "Multiplication is a mathematical operation that represents repeated addition. It is signified by the multiplication sign (×) or asterisk (*).",
    "division": "Division is a mathematical operation that represents splitting into equal parts or groups. It is signified by the division sign (÷) or forward slash (/)."
  };
  
  // Basic common knowledge
  const commonKnowledge = {
    "1+1": "2",
    "2+2": "4",
    "5+3": "8",
    "10-5": "5",
    "2*3": "6",
    "4*4": "16",
    "10/2": "5",
    "hello": "Hello! I'm your study assistant. I can help you with information about your tasks, notes, schedule, or provide study tips. What would you like to know?"
  };
  
  // First check for simple common knowledge responses
  if (commonKnowledge[lowerMessage]) {
    return commonKnowledge[lowerMessage];
  }
  
  // Check for basic math operations in the message
  let mathResult = null;
  
  // Basic calculator for math expressions
  if (/[\d\s\+\-\*\/\(\)\.]+/.test(lowerMessage)) {
    try {
      // Extract just the math expression
      const mathExpression = lowerMessage.replace(/[^0-9\+\-\*\/\(\)\.\s]/g, '').trim();
      if (mathExpression) {
        // Evaluate the math expression (with security checks)
        if (!/[a-zA-Z]/.test(mathExpression) && mathExpression.length < 50) {
          // Safely evaluate the expression
          mathResult = eval(mathExpression).toString();
        }
      }
    } catch (e) {
      // Ignore errors in math evaluation
    }
  }
  
  if (mathResult) {
    return mathResult;
  }
  
  // Check for "what is X" pattern in math
  if (lowerMessage.includes("what is") && Object.keys(mathOperations).some(op => lowerMessage.includes(op))) {
    for (const [op, explanation] of Object.entries(mathOperations)) {
      if (lowerMessage.includes(op)) {
        return explanation;
      }
    }
  }
  
  // Study techniques for educational queries
  const studyTechniques = [
    "The Pomodoro Technique involves studying for 25 minutes, then taking a 5-minute break. After 4 cycles, take a longer break of 15-30 minutes.",
    "Active recall is more effective than re-reading. Try to test yourself by recalling information from memory rather than just reviewing notes.",
    "Spaced repetition helps move information to long-term memory. Review material at increasing intervals over time.",
    "Teaching concepts to others (or pretending to) helps solidify your understanding of the material.",
    "Creating mind maps can help you visualize connections between concepts and improve recall.",
    "Studies show that handwritten notes lead to better retention than typing.",
    "Background music without lyrics can help some students focus, particularly when doing math or writing assignments.",
    "Regular exercise and good sleep habits improve cognitive function and memory consolidation.",
    "The Feynman Technique involves explaining complex concepts in simple terms as if teaching someone else, which reveals gaps in your understanding."
  ];
  
  // Check if message contains study-related keywords
  if (lowerMessage.includes("study") || lowerMessage.includes("learn") || 
      lowerMessage.includes("technique") || lowerMessage.includes("tip")) {
    return `Here's a study tip that might help:\n\n${studyTechniques[Math.floor(Math.random() * studyTechniques.length)]}`;
  }
  
  // Check for programming/computing topics in knowledge base
  for (const [keyword, explanation] of Object.entries(knowledgeBase)) {
    if (lowerMessage.includes(keyword)) {
      return explanation;
    }
  }
  
  // Check for "what is X" pattern
  const whatIsMatch = lowerMessage.match(/what\s+is\s+(\w+)/i);
  if (whatIsMatch && whatIsMatch[1]) {
    const topic = whatIsMatch[1].toLowerCase();
    if (knowledgeBase[topic]) {
      return knowledgeBase[topic];
    }
  }
  
  // Check for "explain X" pattern
  const explainMatch = lowerMessage.match(/explain\s+(\w+)/i);
  if (explainMatch && explainMatch[1]) {
    const topic = explainMatch[1].toLowerCase();
    if (knowledgeBase[topic]) {
      return knowledgeBase[topic];
    }
  }
  
  // Handle greetings
  if (lowerMessage.includes("hi") || lowerMessage.includes("hello") || lowerMessage.includes("hey")) {
    return "Hello! I'm your study assistant. I can help you with information about your tasks, notes, schedule, or provide study tips. What would you like to know?";
  }
  
  // Handle general questions - give a direct response instead of asking for specifics
  if (lowerMessage.includes("what is") || lowerMessage.includes("how does") || lowerMessage.includes("tell me about")) {
    // Extract the topic from the question
    const topic = lowerMessage.replace(/what is|how does|tell me about/g, '').trim();
    
    if (topic.includes("npm")) {
      return knowledgeBase["npm"];
    }
    
    if (topic.includes("array")) {
      return knowledgeBase["array"];
    }
    
    if (topic.includes("javascript") || topic.includes("js")) {
      return knowledgeBase["javascript"];
    }
    
    return `${topic.charAt(0).toUpperCase() + topic.slice(1)} is a concept or topic that refers to something specific. Could you provide more details about what aspect of ${topic} you'd like to learn about?`;
  }
  
  // Default response for unknown general knowledge queries
  return "I can help you with information about your tasks, notes, schedule, and basic programming concepts. What would you like to know?";
};

// Helper to format notes/tasks/schedule for Gemini prompt
function formatUserDataForAI(type, data) {
  if (!data || data.length === 0) return `No ${type} found.`;
  if (type === 'notes') {
    return data.map((note, i) => `Note ${i+1}: ${note.title}\n${note.content.replace(/<[^>]+>/g, '').trim()}`)
      .join('\n---\n');
  }
  if (type === 'tasks') {
    return data.map((task, i) => `Task ${i+1}: ${task.title}\nStatus: ${task.status}\nDue: ${task.dueDate}`)
      .join('\n---\n');
  }
  if (type === 'schedule') {
    return data.map((event, i) => `Event ${i+1}: ${event.title}\nDate: ${event.date}${event.description ? `\nDescription: ${event.description}` : ''}`)
      .join('\n---\n');
  }
  return '';
}

// Function to generate a response based on user query and data
const generateLocalResponse = (message, userData) => {
  const { tasks, notes, schedule, progress, today } = userData;
  
  const lowerMessage = message.toLowerCase();
  
  logDebug(`Processing personal query: "${lowerMessage}"`);
  
  // Date-related queries
  if (lowerMessage.includes('date') || lowerMessage.includes('today') || lowerMessage.includes('day') || lowerMessage.includes('time')) {
    const currentDate = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = currentDate.toLocaleDateString('en-US', dateOptions);
    
    if (lowerMessage.includes('today') || lowerMessage.includes('what is today') || lowerMessage.includes('what day is it')) {
      return `Today is ${formattedDate}.`;
    } else if (lowerMessage.includes('date')) {
      return `The current date is ${formattedDate}.`;
    } else if (lowerMessage.includes('time')) {
      return `The current time is ${currentDate.toLocaleTimeString('en-US')}.`;
    }
    
    return `Today is ${formattedDate}.`;
  }
  
  // Educational subject related queries - simulate internet knowledge
  const subjects = [
    { name: "math", keywords: ["math", "mathematics", "algebra", "calculus", "geometry", "equation", "formula"] },
    { name: "physics", keywords: ["physics", "mechanics", "force", "motion", "energy", "gravity", "momentum", "quantum"] },
    { name: "biology", keywords: ["biology", "cell", "organism", "dna", "evolution", "ecosystem", "species"] },
    { name: "chemistry", keywords: ["chemistry", "element", "compound", "molecule", "reaction", "acid", "base"] },
    { name: "history", keywords: ["history", "war", "revolution", "civilization", "empire", "president", "century"] },
    { name: "literature", keywords: ["literature", "novel", "poem", "author", "character", "shakespeare", "book"] },
    { name: "computer science", keywords: ["programming", "algorithm", "code", "software", "computer", "database", "language", "javascript", "python", "java"] },
    { name: "art", keywords: ["art", "painting", "sculpture", "artist", "museum", "gallery", "canvas"] }
  ];
  
  // Check if the message contains subject-related keywords
  let matchedSubject = null;
  for (const subject of subjects) {
    if (subject.keywords.some(keyword => lowerMessage.includes(keyword))) {
      matchedSubject = subject;
      logDebug(`Matched subject: ${subject.name}`);
      break;
    }
  }
  
  if (matchedSubject) {
    // Check for specific educational questions
    const educationalResponses = {
      "math": {
        "what is": "Mathematics is the study of numbers, quantities, and shapes. It helps us understand patterns and solve problems.",
        "formula": "Mathematical formulas are concise ways to express relationships between variables. For example, the Pythagorean theorem (a²+b²=c²) relates the sides of a right triangle.",
        "equation": "An equation is a mathematical statement that asserts the equality of two expressions.",
        "algebra": "Algebra is a branch of mathematics dealing with symbols and the rules for manipulating these symbols to solve equations.",
        "calculus": "Calculus is the mathematical study of continuous change, with two major branches: differential calculus and integral calculus.",
        "default": "Mathematics is a fundamental discipline that studies numbers, quantities, structure, space, and change. It provides essential tools for science, engineering, and everyday problem-solving."
      },
      "physics": {
        "what is": "Physics is the natural science that studies matter, its motion and behavior through space and time, and the related entities of energy and force.",
        "newton": "Isaac Newton was a key figure in physics who formulated the laws of motion and universal gravitation.",
        "einstein": "Albert Einstein revolutionized physics with the theory of relativity and contributed to quantum mechanics.",
        "gravity": "Gravity is a fundamental force that attracts objects with mass toward each other. On Earth, it gives weight to objects and causes them to fall when dropped.",
        "quantum": "Quantum physics studies the behavior of matter and energy at the smallest scales, where classical physics no longer applies.",
        "default": "Physics explores the fundamental principles governing the natural world, from subatomic particles to the entire universe."
      },
      "biology": {
        "what is": "Biology is the scientific study of life and living organisms, including their physical structure, chemical processes, molecular interactions, and evolution.",
        "cell": "Cells are the basic structural and functional units of all living organisms. They can replicate independently and are often called the 'building blocks of life'.",
        "dna": "DNA (deoxyribonucleic acid) is a molecule that carries genetic instructions for the development, functioning, growth, and reproduction of all known organisms.",
        "evolution": "Evolution is the process by which different kinds of living organisms have developed from earlier forms during the history of the Earth.",
        "default": "Biology explores the fascinating world of living organisms, from microscopic cells to complex ecosystems."
      },
      "chemistry": {
        "what is": "Chemistry is the scientific study of the properties, composition, and structure of matter, the changes it undergoes, and the energy associated with these changes.",
        "element": "An element is a substance that cannot be broken down into simpler substances by chemical means. There are 118 known elements, organized in the periodic table.",
        "compound": "A chemical compound is a substance formed when two or more elements are chemically bonded together.",
        "acid": "Acids are substances that donate hydrogen ions (H+) in aqueous solutions, typically having a sour taste and the ability to react with bases.",
        "base": "Bases are substances that accept hydrogen ions (H+) or donate hydroxide ions (OH-) in aqueous solutions, typically having a bitter taste and a slippery feel.",
        "default": "Chemistry explores the composition, properties, and transformation of matter, providing insights into the building blocks of our physical world."
      },
      "computer science": {
        "what is": "Computer Science is the study of computers and computational systems, including theory, design, development, and application.",
        "algorithm": "An algorithm is a step-by-step procedure or formula for solving a problem or accomplishing a task, especially by a computer.",
        "programming": "Programming is the process of creating a set of instructions that tell a computer how to perform a task.",
        "javascript": "JavaScript is a high-level programming language primarily used for creating interactive elements on websites.",
        "python": "Python is a high-level, general-purpose programming language known for its readability and simplicity.",
        "java": "Java is a widely-used object-oriented programming language designed to have as few implementation dependencies as possible.",
        "default": "Computer Science encompasses both theoretical and practical approaches to computation and its applications."
      },
      "default": "This is an important topic in education. For more detailed information, I recommend checking reliable educational resources or textbooks."
    };
    
    // First check if user's progress data shows study time in this subject
    let userProgress = null;
    if (progress.length > 0) {
      const relevantSubjectProgress = progress
        .filter(entry => entry.subjects && entry.subjects.some(s => 
          s.name.toLowerCase().includes(matchedSubject.name) || 
          matchedSubject.name.includes(s.name.toLowerCase())
        ));
      
      if (relevantSubjectProgress.length > 0) {
        // Calculate total hours spent on this subject
        const totalHours = relevantSubjectProgress.reduce((total, entry) => {
          const subjectEntry = entry.subjects.find(s => 
            s.name.toLowerCase().includes(matchedSubject.name) || 
            matchedSubject.name.includes(s.name.toLowerCase())
          );
          return total + (subjectEntry ? subjectEntry.value : 0);
        }, 0);
        
        userProgress = `You've spent approximately ${totalHours.toFixed(1)} hours studying ${matchedSubject.name} according to your progress records.`;
      }
    }
    
    // Second check if there are notes related to this subject
    let relatedNotes = [];
    if (notes.length > 0) {
      relatedNotes = notes.filter(note => {
        const content = (note.title + ' ' + note.content).toLowerCase();
        return matchedSubject.keywords.some(keyword => content.includes(keyword));
      });
    }
    
    // Now construct the response
    const subjectResponses = educationalResponses[matchedSubject.name] || educationalResponses.default;
    
    // Check for specific question types
    let responseContent = subjectResponses.default;
    for (const [key, value] of Object.entries(subjectResponses)) {
      if (key !== 'default' && lowerMessage.includes(key)) {
        responseContent = value;
        break;
      }
    }
    
    let finalResponse = `${responseContent}`;
    
    // Add personalized information if available
    if (userProgress) {
      finalResponse += `\n\n${userProgress}`;
    }
    
    if (relatedNotes.length > 0) {
      finalResponse += `\n\nI found ${relatedNotes.length} notes related to ${matchedSubject.name} in your collection:`;
      relatedNotes.slice(0, 3).forEach((note, index) => {
        finalResponse += `\n${index + 1}. "${note.title}" - Last updated on ${note.updatedAt}`;
      });
    }
    
    return finalResponse;
  }
  
  // --- NOTES ---
  if (/(note|notes|display.*notes|show.*notes|list.*notes|see.*notes|all.*notes)/.test(lowerMessage)) {
    if (notes.length === 0) {
      return "You don't have any notes saved.";
    }
    // Most recent notes
    if (lowerMessage.includes('recent')) {
      return `Here are your most recent notes:\n\n` + 
        notes.slice(0, 5).map((note, index) => 
          `${index + 1}. ${note.title}\n   ${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}`
        ).join('\n\n');
    }
    // Completed notes (if you have a status for notes)
    if (lowerMessage.includes('completed')) {
      const completedNotes = notes.filter(note => note.status === 'completed');
      if (completedNotes.length === 0) return "You don't have any completed notes.";
      return `Here are your completed notes:\n\n` + 
        completedNotes.slice(0, 5).map((note, index) => 
          `${index + 1}. ${note.title}\n   ${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}`
        ).join('\n\n');
    }
    // Default: show all notes (up to 5)
    return `Here are your notes:\n\n` + 
      notes.slice(0, 5).map((note, index) => 
        `${index + 1}. ${note.title}\n   ${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}`
      ).join('\n\n');
  }
  
  // --- TASKS ---
  if (/(task|tasks|display.*tasks|show.*tasks|list.*tasks|see.*tasks|all.*tasks)/.test(lowerMessage)) {
    if (tasks.length === 0) {
      return "You don't have any tasks in your list.";
    }
    // Most recent tasks
    if (lowerMessage.includes('recent')) {
      return `Here are your most recent tasks:\n\n` +
        tasks.slice(-5).reverse().map((task, index) =>
          `${index + 1}. ${task.title} (Due: ${task.dueDate}, Status: ${task.status})`
        ).join('\n');
    }
    // Completed tasks
    if (lowerMessage.includes('completed')) {
      const completedTasks = tasks.filter(task => task.status === 'completed');
      if (completedTasks.length === 0) return "You don't have any completed tasks.";
      return `Here are your completed tasks:\n\n` +
        completedTasks.slice(0, 5).map((task, index) =>
          `${index + 1}. ${task.title} (Due: ${task.dueDate}, Status: completed)`
        ).join('\n');
    }
    // Urgent tasks (earliest due date, not completed)
    if (lowerMessage.includes('urgent')) {
      const urgentTasks = tasks.filter(task => task.status !== 'completed')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      if (urgentTasks.length === 0) return "You don't have any urgent tasks.";
      return `Here are your most urgent tasks:\n\n` +
        urgentTasks.slice(0, 5).map((task, index) =>
          `${index + 1}. ${task.title} (Due: ${task.dueDate}, Status: ${task.status})`
        ).join('\n');
    }
    // Default: show all tasks (up to 5)
    return `Here are your tasks:\n\n` +
      tasks.slice(0, 5).map((task, index) =>
        `${index + 1}. ${task.title} (Due: ${task.dueDate}, Status: ${task.status})`
      ).join('\n');
  }
  
  // --- SCHEDULE ---
  if (/(schedule|reminder|calendar|event|display.*schedule|show.*schedule|list.*schedule|see.*schedule|all.*schedule)/.test(lowerMessage)) {
    if (schedule.length === 0) {
      return "You don't have any scheduled reminders or events.";
    }
    // Most recent events
    if (lowerMessage.includes('recent')) {
      return `Here are your most recent scheduled events:\n\n` +
        schedule.slice(-5).reverse().map((event, index) =>
          `${index + 1}. ${event.title} (${event.date})${event.description ? '\n   ' + event.description : ''}`
        ).join('\n\n');
    }
    // Urgent events (soonest date)
    if (lowerMessage.includes('urgent')) {
      const urgentEvents = schedule
        .filter(event => new Date(event.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      if (urgentEvents.length === 0) return "You don't have any urgent events.";
      return `Here are your most urgent upcoming events:\n\n` +
        urgentEvents.slice(0, 5).map((event, index) =>
          `${index + 1}. ${event.title} (${event.date})${event.description ? '\n   ' + event.description : ''}`
        ).join('\n\n');
    }
    // Default: show all events (up to 5)
    return `Here are your upcoming scheduled events:\n\n` +
      schedule.slice(0, 5).map((event, index) =>
        `${index + 1}. ${event.title} (${event.date})${event.description ? '\n   ' + event.description : ''}`
      ).join('\n\n');
  }
  
  // Progress-related queries
  if (lowerMessage.includes('progress') || lowerMessage.includes('study time') || lowerMessage.includes('study hours')) {
    if (progress.length === 0) {
      return "You don't have any progress data recorded yet.";
    }
    
    // Check for total study time
    if (lowerMessage.includes('total') || lowerMessage.includes('overall')) {
      const totalStudyHours = progress.reduce((total, entry) => total + (entry.studyHours || 0), 0);
      const totalCompletedTasks = progress.reduce((total, entry) => total + (entry.completedTasks || 0), 0);
      
      return `Your overall progress:\n\n` +
        `- Total study time: ${totalStudyHours.toFixed(1)} hours\n` +
        `- Total completed tasks: ${totalCompletedTasks}\n` +
        `- Tracked days: ${progress.length}`;
    }
    
    // Default progress response
    return `Here's your recent progress:\n\n` + 
      progress.slice(0, 3).map((entry, index) => 
        `${entry.date}:\n` +
        `- Study hours: ${entry.studyHours || 0}\n` +
        `- Completed tasks: ${entry.completedTasks || 0}` +
        (entry.subjects && entry.subjects.length > 0 ? 
          `\n- Subjects: ${entry.subjects.map(s => `${s.name} (${s.value})`).join(', ')}` : '')
      ).join('\n\n');
  }
  
  // Study advice
  if (lowerMessage.includes('study') || lowerMessage.includes('learn') || lowerMessage.includes('technique') || lowerMessage.includes('tip')) {
    const studyTips = [
      "The Pomodoro Technique can help: Study for 25 minutes, then take a 5-minute break. After 4 cycles, take a longer break of 15-30 minutes.",
      "Active recall is more effective than re-reading. Try to recall information from memory rather than just reviewing notes.",
      "Spaced repetition helps move information to long-term memory. Review material at increasing intervals.",
      "Teaching concepts to others (or even to an imaginary student) helps solidify your understanding.",
      "Creating mind maps can help you visualize connections between concepts and improve recall.",
      "Studies show that handwritten notes lead to better retention than typing.",
      "Background music without lyrics can help some students focus, particularly when doing math or writing assignments.",
      "Get enough sleep! Your brain consolidates memories during deep sleep phases.",
      "Regular exercise improves cognitive function and memory consolidation.",
      "Try the Feynman Technique: Explain a concept in simple terms as if teaching it to someone else. This reveals gaps in your understanding."
    ];
    
    return `Here's a study tip that might help:\n\n${studyTips[Math.floor(Math.random() * studyTips.length)]}`;
  }
  
  // Handle simple greetings
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! I'm your study assistant. I can help you with information about your tasks, notes, schedule, or provide study tips. What would you like to know?";
  }
  
  // Handle thank you messages
  if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    return "You're welcome! Let me know if you need anything else.";
  }
  
  // Special case for educational questions that didn't match a subject keyword
  if (lowerMessage.includes('what is') || lowerMessage.includes('how does') || lowerMessage.includes('tell me about')) {
    logDebug("Identified educational question without specific subject match");
    
    // General educational response
    return "I can answer questions about various subjects like mathematics, physics, biology, chemistry, computer science, and more. Could you specify which subject you're interested in?";
  }
  
  // Default response for unrecognized queries
  const examples = [
    "What tasks do I have today?",
    "Show me my notes about [topic]",
    "What's on my schedule for 5/25?",
    "How much have I studied this week?",
    "Give me a study tip",
    "Tell me about mathematics",
    "What is computer programming?"
  ];
  
  // Return a different example each time
  const randomExample = examples[Math.floor(Math.random() * examples.length)];
  
  return `I'm not sure what you're asking for. I can help with your tasks, notes, schedule, progress, and educational topics. Try asking something like:\n\n"${randomExample}"`;
};

// GET /api/chatbot/history - fetch chat history for the logged-in user
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const history = await ChatMessage.find({ userId }).sort({ timestamp: 1 });
    res.json({ history });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Failed to fetch chat history.' });
  }
});

// POST /api/chatbot/query - process a chatbot query and store messages
router.post('/query', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.userId;
    if (!message) {
      return res.status(400).json({ message: 'Query message is required' });
    }
    await ChatMessage.create({ userId, role: 'user', message });

    const isPersonal = isPersonalDataQuery(message);
    let response;
    if (isPersonal) {
      // Fetch user data
      const userTasks = await getUserTasks(userId);
      const userNotes = await getUserNotes(userId);
      const userSchedule = await getUserSchedule(userId);
      const userProgress = await getUserProgress(userId);
      const today = new Date().toISOString().split('T')[0];
      const userData = {
        tasks: userTasks.map(task => ({
          id: task._id.toString(),
          title: task.title,
          dueDate: task.dueDate.toISOString().split('T')[0],
          status: task.status
        })),
        notes: userNotes.map(note => ({
          id: note._id.toString(),
          title: note.title,
          content: note.content || '',
          updatedAt: note.updatedAt ? note.updatedAt.toISOString().split('T')[0] : today
        })),
        schedule: userSchedule.map(reminder => ({
          id: reminder._id ? reminder._id.toString() : 'unknown',
          title: reminder.title || 'Untitled Event',
          description: reminder.description || '',
          date: reminder.date ? reminder.date.toISOString().split('T')[0] : today
        })),
        progress: userProgress.map(prog => ({
          date: prog.date ? prog.date.toISOString().split('T')[0] : today,
          completedTasks: prog.completedTasks || 0,
          studyHours: prog.studyHours || 0,
          subjects: prog.subjects || []
        })),
        today
      };
      // Determine which type of data is being asked for
      let type = 'tasks';
      if (/note/.test(message.toLowerCase())) type = 'notes';
      else if (/schedule|reminder|calendar|event/.test(message.toLowerCase())) type = 'schedule';
      // Format the relevant data
      const formattedData = formatUserDataForAI(type, userData[type]);
      // Compose prompt for Gemini
      const aiPrompt = `User asked: "${message}"
Here is their ${type} data:
${formattedData}
Please answer the user's question or summarize the data in a helpful, conversational way.`;
      try {
        response = await askGemini(aiPrompt);
      } catch (error) {
        // Fallback to local logic if Gemini fails
        response = generateLocalResponse(message, userData);
      }
    } else {
      // For general knowledge questions, use Gemini API
      try {
        response = await askGemini(message);
      } catch (error) {
        response = generateGeneralKnowledgeResponse(message);
      }
    }
    await ChatMessage.create({ userId, role: 'bot', message: response });
    res.json({ response });
  } catch (error) {
    res.status(500).json({ message: 'Server error processing your request', error: process.env.NODE_ENV === 'production' ? null : error.message });
  }
});

export default router; 