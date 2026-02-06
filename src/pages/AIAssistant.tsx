import { useState, useRef, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, MicOff, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { streamChat } from "@/lib/ai-service";
import { toast } from "@/hooks/use-toast";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  "Why are my tomato leaves turning yellow?",
  "What's the best time to plant rice in Punjab?",
  "How much water does wheat need daily?",
  "How to control aphids organically?",
  "What fertilizer should I use for maize?",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Namaste! 🙏 I'm your AI farming assistant. Ask me anything about crops, diseases, irrigation, or farming practices. I can help you in your local language too!\n\n🎙️ **Tip**: Tap the microphone button to speak your question instead of typing!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isListening, isSupported, toggleListening, interimTranscript } = useVoiceInput({
    language: "en-IN",
    onResult: (transcript) => {
      setInput(transcript);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = useCallback(async (textToSend?: string) => {
    const messageText = textToSend || input.trim();
    if (!messageText || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    let assistantContent = "";
    const assistantId = (Date.now() + 1).toString();

    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      },
    ]);

    try {
      await streamChat({
        messages: messages
          .filter((m) => m.id !== "1")
          .concat(userMessage)
          .map((m) => ({ role: m.role, content: m.content })),
        onDelta: (chunk) => {
          assistantContent += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: assistantContent } : m
            )
          );
        },
        onDone: () => {
          setIsTyping(false);
        },
        onError: (error) => {
          console.error("AI error:", error);
          toast({
            variant: "destructive",
            title: "AI Error",
            description: error.message || "Failed to get response. Please try again.",
          });
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          setIsTyping(false);
        },
      });
    } catch (error) {
      console.error("Stream error:", error);
      setIsTyping(false);
    }
  }, [input, isTyping, messages]);

  const handleSuggestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64 h-screen flex flex-col">
        <Header 
          title="AI Farming Assistant" 
          subtitle="Ask questions in any language - I'm here to help!" 
        />
        
        <main className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 lg:gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] lg:max-w-2xl p-3 lg:p-4 rounded-2xl ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border rounded-tl-sm"
                  }`}
                >
                  {message.content ? (
                    <div className="prose prose-sm max-w-none text-sm leading-relaxed">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          h3: ({ children }) => <h3 className="font-semibold text-base mb-1 mt-2">{children}</h3>,
                          h4: ({ children }) => <h4 className="font-semibold mb-1 mt-2">{children}</h4>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Thinking...
                    </span>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice interim transcript */}
          {isListening && interimTranscript && (
            <div className="mb-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/30 text-sm text-foreground animate-pulse">
              🎙️ {interimTranscript}...
            </div>
          )}

          {/* Suggestions */}
          {messages.length <= 2 && (
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
                    className="px-3 lg:px-4 py-2 bg-card border border-border rounded-full text-xs lg:text-sm text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 lg:gap-3">
            {isSupported && (
              <Button 
                variant={isListening ? "destructive" : "outline"} 
                size="icon" 
                className={`flex-shrink-0 ${isListening ? "animate-pulse" : ""}`}
                onClick={toggleListening}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
            )}
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening... speak now 🎙️" : "Type your question here..."}
              className="flex-1"
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              disabled={isTyping}
            />
            <Button onClick={() => handleSend()} disabled={!input.trim() || isTyping}>
              {isTyping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
