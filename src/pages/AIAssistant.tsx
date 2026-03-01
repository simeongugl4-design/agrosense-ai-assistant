import { useState, useRef, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, MicOff, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSelector } from "@/components/dashboard/LanguageSelector";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedQuestions: Record<string, string[]> = {
  English: [
    "Why are my tomato leaves turning yellow?",
    "What's the best time to plant rice?",
    "How much water does wheat need daily?",
    "How to control aphids organically?",
    "What fertilizer should I use for maize?",
  ],
  Hindi: [
    "मेरे टमाटर के पत्ते पीले क्यों हो रहे हैं?",
    "धान बोने का सबसे अच्छा समय क्या है?",
    "गेहूं को रोजाना कितना पानी चाहिए?",
    "एफिड्स को जैविक तरीके से कैसे नियंत्रित करें?",
    "मक्का के लिए कौन सा उर्वरक उपयोग करें?",
  ],
};

export default function AIAssistant() {
  const { selectedLanguage, selectedCountry } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `Welcome! 🌾 I'm your AI Agricultural Assistant. Ask me anything about crops, diseases, irrigation, or farming practices.\n\n🌍 **Language**: ${selectedLanguage || "English"}\n🎙️ **Tip**: Use the microphone to speak your question!`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isListening, isSupported, toggleListening, interimTranscript } = useVoiceInput({
    language: "en",
    onResult: (transcript) => setInput(transcript),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset welcome message when language changes
  useEffect(() => {
    setMessages([{
      id: "1",
      role: "assistant",
      content: `Welcome! 🌾 I'm your AI Agricultural Assistant.\n\n🌍 **Country**: ${selectedCountry || "Not set"}\n🗣️ **Language**: ${selectedLanguage || "English"}\n\nAll my responses will be in **${selectedLanguage || "English"}**. Ask me anything about agriculture!`,
      timestamp: new Date(),
    }]);
  }, [selectedLanguage, selectedCountry]);

  const handleSend = useCallback(async (textToSend?: string) => {
    const messageText = textToSend || input.trim();
    if (!messageText || isTyping) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: messageText, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    let assistantContent = "";
    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", timestamp: new Date() }]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: messages.filter(m => m.id !== "1").concat(userMessage).map(m => ({ role: m.role, content: m.content })),
            language: selectedLanguage,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to connect to AI");
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m));
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "AI Error", description: error instanceof Error ? error.message : "Failed to get response" });
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages, selectedLanguage]);

  const currentSuggestions = suggestedQuestions[selectedLanguage] || suggestedQuestions.English;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64 h-screen flex flex-col">
        <Header title="AI Agricultural Assistant" subtitle={`Speaking in ${selectedLanguage || "English"}`} />
        <main className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden">
          {/* Language selector */}
          <div className="mb-3 flex items-center gap-3">
            <LanguageSelector />
            <span className="text-xs text-muted-foreground">Select your language before asking questions</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.map(message => (
              <div key={message.id} className={`flex gap-2 lg:gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[85%] lg:max-w-2xl p-3 lg:p-4 rounded-2xl ${
                  message.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border rounded-tl-sm"
                }`}>
                  {message.content ? (
                    <div className="prose prose-sm max-w-none text-sm leading-relaxed">
                      <ReactMarkdown components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                      }}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />Thinking...</span>
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

          {isListening && interimTranscript && (
            <div className="mb-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/30 text-sm animate-pulse">🎙️ {interimTranscript}...</div>
          )}

          {messages.length <= 2 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4" />Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {currentSuggestions.map(q => (
                  <button key={q} onClick={() => setInput(q)} className="px-3 py-2 bg-card border border-border rounded-full text-xs text-foreground hover:border-primary/50 transition-all">{q}</button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {isSupported && (
              <Button variant={isListening ? "destructive" : "outline"} size="icon" className={isListening ? "animate-pulse" : ""} onClick={toggleListening}>
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
            )}
            <Input value={input} onChange={e => setInput(e.target.value)} placeholder={isListening ? "Listening..." : "Type your question..."} className="flex-1" onKeyPress={e => e.key === "Enter" && handleSend()} disabled={isTyping} />
            <Button onClick={() => handleSend()} disabled={!input.trim() || isTyping}>
              {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
