import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, MicOff, Bot, User, Sparkles, Loader2, Languages } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSelector } from "@/components/dashboard/LanguageSelector";
import { COUNTRY_LANGUAGES } from "@/lib/language-data";
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
    "How do I control aphids organically?",
    "What fertilizer should I use for maize?",
  ],
  Hindi: [
    "मेरे टमाटर के पत्ते पीले क्यों हो रहे हैं?",
    "धान बोने का सबसे अच्छा समय क्या है?",
    "गेहूं को रोजाना कितना पानी चाहिए?",
    "एफिड्स को जैविक तरीके से कैसे नियंत्रित करें?",
    "मक्का के लिए कौन सा उर्वरक उपयोग करें?",
  ],
  "Tok Pisin": [
    "Bilong wanem lip bilong tomato bilong mi i kamap yelo?",
    "Wanem taim i gutpela long planim kaikai kumu o kon?",
    "Hammas wara naisim long givim long kaikai kon long olgeta de?",
    "Mi ken daunim aphids long pasin bilong graun olsem wanem?",
    "Wanem kain gris/fertilizer bai mi yusim long maize?",
  ],
  Spanish: [
    "¿Por qué se están poniendo amarillas las hojas de mi tomate?",
    "¿Cuál es el mejor momento para sembrar arroz?",
    "¿Cuánta agua necesita el maíz cada día?",
    "¿Cómo controlo los pulgones de forma orgánica?",
    "¿Qué fertilizante debo usar para el maíz?",
  ],
  French: [
    "Pourquoi les feuilles de mes tomates jaunissent-elles ?",
    "Quel est le meilleur moment pour semer le riz ?",
    "De combien d'eau le maïs a-t-il besoin chaque jour ?",
    "Comment lutter contre les pucerons de façon biologique ?",
    "Quel engrais dois-je utiliser pour le maïs ?",
  ],
  Portuguese: [
    "Por que as folhas do meu tomate estão ficando amarelas?",
    "Qual é a melhor época para plantar arroz?",
    "Quanta água o milho precisa por dia?",
    "Como controlar pulgões de forma orgânica?",
    "Que fertilizante devo usar para o milho?",
  ],
  Swahili: [
    "Kwa nini majani ya nyanya yangu yanageuka njano?",
    "Ni wakati gani bora wa kupanda mpunga?",
    "Mahindi yanahitaji maji kiasi gani kila siku?",
    "Nidhibiti vipi vidukari kwa njia ya asili?",
    "Nitumie mbolea gani kwa mahindi?",
  ],
  Arabic: [
    "لماذا تتحول أوراق الطماطم إلى اللون الأصفر؟",
    "ما أفضل وقت لزراعة الأرز؟",
    "كمية الماء التي يحتاجها القمح يوميًا؟",
    "كيف أسيطر على حشرة المن بطريقة عضوية؟",
    "ما السماد المناسب للذرة؟",
  ],
};

const speechLocaleMap: Record<string, string> = {
  English: "en-US",
  Hindi: "hi-IN",
  Bengali: "bn-BD",
  Arabic: "ar-SA",
  French: "fr-FR",
  Spanish: "es-ES",
  Portuguese: "pt-BR",
  Swahili: "sw-KE",
  German: "de-DE",
  Italian: "it-IT",
  Japanese: "ja-JP",
  Korean: "ko-KR",
  Russian: "ru-RU",
  Turkish: "tr-TR",
  Vietnamese: "vi-VN",
  Thai: "th-TH",
  Indonesian: "id-ID",
  Filipino: "fil-PH",
  Malay: "ms-MY",
  Dutch: "nl-NL",
  Polish: "pl-PL",
  Romanian: "ro-RO",
  Ukrainian: "uk-UA",
  Urdu: "ur-PK",
  Tamil: "ta-IN",
  Telugu: "te-IN",
  Marathi: "mr-IN",
  Gujarati: "gu-IN",
  Punjabi: "pa-IN",
  Nepali: "ne-NP",
  Sinhala: "si-LK",
  Khmer: "km-KH",
  Lao: "lo-LA",
  Burmese: "my-MM",
  Persian: "fa-IR",
  Hebrew: "he-IL",
  Greek: "el-GR",
  Hungarian: "hu-HU",
  Czech: "cs-CZ",
  Slovak: "sk-SK",
  Danish: "da-DK",
  Norwegian: "no-NO",
  Swedish: "sv-SE",
  Finnish: "fi-FI",
  Croatian: "hr-HR",
  Serbian: "sr-RS",
  Bosnian: "bs-BA",
  Bulgarian: "bg-BG",
  Lithuanian: "lt-LT",
  Latvian: "lv-LV",
  Estonian: "et-EE",
  Catalan: "ca-ES",
  Tok: "en-US",
};

const getVoiceLocale = (language: string, country: string) => {
  if (!language) return "en-US";
  if (speechLocaleMap[language]) return speechLocaleMap[language];

  const fallbackCountryCode = COUNTRY_LANGUAGES.find((entry) => entry.country === country)?.code || "US";
  const normalizedLanguage = language.toLowerCase();

  if (normalizedLanguage.includes("tok pisin") || normalizedLanguage.includes("hiri motu")) {
    return `en-${fallbackCountryCode}`;
  }

  const baseLanguage = normalizedLanguage
    .replace(/[^a-z\s-]/g, "")
    .split(/[\s-]+/)
    .find(Boolean)
    ?.slice(0, 2);

  return baseLanguage
    ? `${baseLanguage}-${fallbackCountryCode}`
    : `en-${fallbackCountryCode}`;
};

const getWelcomeMessage = (language: string, country: string, voiceLocale: string) =>
  `Welcome! 🌾 I'm your AI Agricultural Assistant.\n\n🌍 **Country**: ${country || "Not set"}\n🗣️ **Response language**: ${language || "English"}\n🎙️ **Voice input locale**: ${voiceLocale}\n\nAsk about crops, pests, irrigation, soil health, fertilizer, weather, or farm markets.`;

export default function AIAssistant() {
  const { selectedLanguage, selectedCountry } = useLanguage();
  const voiceLocale = useMemo(
    () => getVoiceLocale(selectedLanguage || "English", selectedCountry || ""),
    [selectedCountry, selectedLanguage],
  );

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: getWelcomeMessage(selectedLanguage || "English", selectedCountry || "", voiceLocale),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isListening,
    isSupported,
    toggleListening,
    interimTranscript,
    error: voiceError,
  } = useVoiceInput({
    language: voiceLocale,
    onResult: (transcript) => setInput(transcript.trim()),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: getWelcomeMessage(selectedLanguage || "English", selectedCountry || "", voiceLocale),
        timestamp: new Date(),
      },
    ]);
  }, [selectedLanguage, selectedCountry, voiceLocale]);

  useEffect(() => {
    if (!voiceError) return;
    toast({
      variant: "destructive",
      title: "Voice input error",
      description: voiceError,
    });
  }, [voiceError]);

  const handleSend = useCallback(async (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
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
      { id: assistantId, role: "assistant", content: "", timestamp: new Date() },
    ]);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: messages
            .filter((message) => message.id !== "1")
            .concat(userMessage)
            .map((message) => ({ role: message.role, content: message.content })),
          language: selectedLanguage,
          country: selectedCountry,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to connect to AI");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No AI response body received");
      }

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
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantId ? { ...message, content: assistantContent } : message,
                ),
              );
            }
          } catch {
            buffer = `${line}\n${buffer}`;
            break;
          }
        }
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: error instanceof Error ? error.message : "Failed to get response",
      });
      setMessages((prev) => prev.filter((message) => message.id !== assistantId));
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages, selectedCountry, selectedLanguage]);

  const currentSuggestions = suggestedQuestions[selectedLanguage] || suggestedQuestions.English;
  const inputPlaceholder = isListening
    ? `Listening in ${selectedLanguage || "your language"}...`
    : `Ask your farming question in ${selectedLanguage || "English"}...`;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64 h-screen flex flex-col">
        <Header title="AI Agricultural Assistant" subtitle={`Speaking in ${selectedLanguage || "English"}`} />
        <main className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <LanguageSelector />
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
              <Languages className="w-3.5 h-3.5 text-primary" />
              Replies in <span className="font-medium text-foreground">{selectedLanguage || "English"}</span>
              <span className="text-border">•</span>
              Voice locale <span className="font-medium text-foreground">{voiceLocale}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-2 lg:gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[85%] lg:max-w-2xl p-3 lg:p-4 rounded-2xl ${message.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border rounded-tl-sm"}`}>
                  {message.content ? (
                    <div className="prose prose-sm max-w-none text-sm leading-relaxed">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
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

          {isListening && interimTranscript && (
            <div className="mb-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm animate-pulse">
              🎙️ {interimTranscript}...
            </div>
          )}

          {messages.length <= 2 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Tap a farming question to ask instantly
              </p>
              <div className="flex flex-wrap gap-2">
                {currentSuggestions.map((question) => (
                  <button
                    key={question}
                    onClick={() => handleSend(question)}
                    className="px-3 py-2 bg-card border border-border rounded-full text-xs text-foreground hover:border-primary/50 transition-all"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {isSupported && (
              <Button
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                className={isListening ? "animate-pulse" : ""}
                onClick={toggleListening}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
            )}
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={inputPlaceholder}
              className="flex-1"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSend();
                }
              }}
              disabled={isTyping}
            />
            <Button onClick={() => handleSend()} disabled={!input.trim() || isTyping}>
              {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}

