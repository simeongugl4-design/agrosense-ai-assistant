import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, Bot, User, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  "Why are my tomato leaves turning yellow?",
  "What's the best time to plant rice?",
  "How much water does wheat need daily?",
  "How to control aphids organically?",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Namaste! 🙏 I'm your AI farming assistant. Ask me anything about crops, diseases, irrigation, or farming practices. I can help you in your local language too!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const responses: Record<string, string> = {
      yellow: "Yellow leaves on tomato plants can indicate several issues:\n\n1. **Nitrogen deficiency** - The most common cause. Add nitrogen-rich fertilizer or compost.\n\n2. **Overwatering** - Check if soil is waterlogged. Allow soil to dry between watering.\n\n3. **Fungal disease** - Look for spots or patterns. Apply neem oil if needed.\n\n4. **Natural aging** - Lower leaves yellowing is normal as plant focuses energy on new growth.\n\nWould you like specific treatment recommendations?",
      rice: "The best time to plant rice depends on your region:\n\n🌱 **Kharif Season (Main crop)**\n- Plant: June-July\n- Harvest: November-December\n\n🌾 **Rabi Season (Second crop)**\n- Plant: November-December\n- Harvest: March-April\n\nFor your region, I recommend starting nursery preparation 2-3 weeks before transplanting. Would you like a detailed rice planting calendar?",
      water: "Wheat water requirements vary by growth stage:\n\n💧 **Germination**: Light irrigation every 2-3 days\n💧 **Tillering**: 60-80mm per irrigation\n💧 **Flowering**: Critical stage - 80-100mm\n💧 **Grain filling**: 60-80mm, reduce gradually\n\n**Total requirement**: 450-650mm for the full cycle.\n\nBased on your soil type, I recommend drip irrigation for 20% water savings.",
      aphid: "Here are organic methods to control aphids:\n\n🌿 **Neem oil spray**\n- Mix 5ml neem oil + 1L water + few drops soap\n- Spray early morning or evening\n\n🐞 **Beneficial insects**\n- Encourage ladybugs and lacewings\n- Plant marigolds as companion plants\n\n🧄 **Garlic spray**\n- Blend 4-5 garlic cloves in 1L water\n- Strain and spray on affected areas\n\n💦 **Water spray**\n- Strong jet of water can dislodge aphids\n\nRepeat treatments every 3-4 days for best results!",
    };

    const responseKey = Object.keys(responses).find((key) =>
      input.toLowerCase().includes(key)
    );

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: responseKey
        ? responses[responseKey]
        : "That's a great question! Based on my agricultural knowledge, I'd recommend consulting with a local agricultural expert for region-specific advice. In the meantime, I can help you with crop recommendations, disease identification, or irrigation planning. What would you like to know more about?",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMessage]);
    setIsTyping(false);
  };

  const handleSuggestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64 h-screen flex flex-col">
        <Header 
          title="AI Farming Assistant" 
          subtitle="Ask questions in any language - I'm here to help!" 
        />
        
        <main className="flex-1 flex flex-col p-6 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-2xl p-4 rounded-2xl ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border rounded-tl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm p-4">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Try asking:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    onClick={() => handleSuggestion(question)}
                    className="px-4 py-2 bg-card border border-border rounded-full text-sm text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex gap-3">
            <Button variant="outline" size="icon" className="flex-shrink-0">
              <Mic className="w-5 h-5" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question here..."
              className="flex-1"
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
            />
            <Button onClick={handleSend} disabled={!input.trim()}>
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
