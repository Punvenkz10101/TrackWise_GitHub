
import React, { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, SendHorizontal, User } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

// Sample AI responses
const sampleResponses = [
  "Based on your study pattern, I recommend focusing on chapter 5 today.",
  "The quadratic formula is x = (-b ± √(b² - 4ac)) / 2a. It's used to solve quadratic equations in the form ax² + bx + c = 0.",
  "For effective memorization, try spaced repetition. Review the material after 1 day, then 3 days, then 7 days.",
  "I suggest breaking down this assignment into smaller tasks. Start with the research phase, then outline, draft, and finally revise.",
  "The law of conservation of energy states that energy can neither be created nor destroyed, only transformed from one form to another.",
  "To improve your focus during study sessions, try the Pomodoro technique: 25 minutes of focused work followed by a 5-minute break.",
  "When writing an essay, make sure your thesis statement is clear and that each paragraph supports it with evidence.",
  "In mathematics, a function is a relation between sets where each input has exactly one output.",
  "To prepare for your exam, create a study schedule, review your notes regularly, practice with past papers, and get enough sleep the night before.",
  "The three branches of government in the United States are the executive, legislative, and judicial branches.",
];

const ChatbotPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your AI study assistant. How can I help you today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Simulate AI thinking
    setIsTyping(true);

    // Simulate AI response after a delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getAIResponse(inputValue),
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getAIResponse = (userInput: string): string => {
    // This is a simple simulation. In a real app, this would connect to an API
    const lowerCaseInput = userInput.toLowerCase();
    
    if (lowerCaseInput.includes("hello") || lowerCaseInput.includes("hi")) {
      return "Hello! How can I assist with your studies today?";
    } else if (lowerCaseInput.includes("thank")) {
      return "You're welcome! Feel free to ask if you have any more questions.";
    } else if (lowerCaseInput.includes("help") || lowerCaseInput.includes("stuck")) {
      return "I'd be happy to help! What specific topic or problem are you working on?";
    } else if (lowerCaseInput.includes("math") || lowerCaseInput.includes("equation")) {
      return "For math problems, I recommend breaking them down step by step. Can you share the specific equation or concept you're working on?";
    } else if (lowerCaseInput.includes("study") || lowerCaseInput.includes("learn")) {
      return "Effective studying involves active recall, spaced repetition, and connecting new information to things you already know. What subject are you focusing on?";
    } else {
      // Return a random response from the sample responses
      return sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Study Assistant</h1>
          <p className="text-muted-foreground">
            Get help with your studies and assignments
          </p>
        </div>

        <Card className="flex flex-col h-[calc(100vh-200px)]">
          <CardHeader>
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>TrackWise Assistant</CardTitle>
                <CardDescription>
                  Ask me anything about your studies
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex max-w-[80%] ${
                        message.sender === "user"
                          ? "flex-row-reverse"
                          : "flex-row"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full ${
                          message.sender === "user"
                            ? "ml-2 bg-primary text-primary-foreground"
                            : "mr-2 bg-muted"
                        }`}
                      >
                        {message.sender === "user" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            message.sender === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex max-w-[80%] flex-row">
                      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full mr-2 bg-muted">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="rounded-lg px-4 py-2 bg-muted">
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]"></div>
                            <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]"></div>
                            <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="pt-4 border-t bg-background">
            <div className="flex w-full items-center space-x-2">
              <Input
                placeholder="Ask anything about your studies..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isTyping}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!inputValue.trim() || isTyping}
              >
                <SendHorizontal className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ChatbotPage;
