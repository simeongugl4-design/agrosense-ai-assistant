import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Loader2, Bot, User, Leaf, Trash2, Sprout, Bug, CloudRain, Droplets, FlaskConical } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface Msg { role: "user" | "assistant"; content: string }

const STORAGE_KEY = "agrosense_chat_history_v2";

const ROUTE_HINTS: Record<string, string> = {
  "/dashboard/disease": "User is on the Disease Scanner page.",
  "/dashboard/pests": "User is on the Pest Detection page.",
  "/dashboard/weather": "User is on the Weather page.",
  "/dashboard/irrigation": "User is on the Irrigation page.",
  "/dashboard/fertilizer": "User is on the Fertilizer page.",
  "/dashboard/soil": "User is on the Soil Analysis page.",
  "/dashboard/crops": "User is on the Crop Advisor page.",
  "/dashboard/calendar": "User is on the Farm Calendar page.",
  "/dashboard/marketplace": "User is on the Marketplace.",
  "/dashboard/safety": "User is on the Safety / Tank-Mix Checker.",
  "/dashboard/livestock": "User is on the Livestock page.",
  "/dashboard/yield": "User is on the Yield Prediction page.",
  "/dashboard/satellite": "User is on the Satellite Monitoring page.",
  "/dashboard/finance": "User is on the Farm Finance page.",
  "/dashboard/carbon": "User is on the Carbon Credits page.",
  "/dashboard/subsidies": "User is on the Subsidies page.",
  "/dashboard/alerts": "User is on the Alert Engine page.",
};

const QUICK_PROMPTS = [
  { icon: Sprout, label: "Best crop for my season", text: "Based on my region and the current season, what crop should I plant next and why?" },
  { icon: Bug, label: "Diagnose pest", text: "I see small holes and chewed leaves on my plants. Help me identify the pest and the safest treatment." },
  { icon: CloudRain, label: "Weather plan", text: "Give me a 7-day farm action plan based on typical weather for this time of year." },
  { icon: Droplets, label: "Irrigation schedule", text: "Build me an efficient irrigation schedule that saves water." },
  { icon: FlaskConical, label: "Fertilizer plan", text: "Recommend an NPK fertilizer plan with dosage and timing for my main crop." },
];

function loadHistory(): Msg[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch { /* ignore */ }
  return [{
    role: "assistant",
    content: "👋 **Welcome to AgroSense AI!**\n\nI'm your intelligent farm copilot. I can help with:\n\n- 🌱 Crop selection & rotation\n- 🐛 Pest & disease diagnosis\n- 💧 Irrigation planning\n- 🧪 Fertilizer & soil health\n- 🌦️ Weather-based decisions\n- 🐄 Livestock care\n- 💰 Finance, subsidies & carbon credits\n\n**Ask me anything — I remember our conversation.**",
  }];
}

export function GlobalChatbot() {
  const { selectedLanguage } = useLanguage();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(loadHistory);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, loading]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40))); } catch { /* ignore */ }
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendText = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);

    try {
      const hint = ROUTE_HINTS[location.pathname];
      const primed: Msg[] = hint
        ? [{ role: "user" as const, content: `Context: ${hint}` }, ...next.slice(-12)]
        : next.slice(-12);

      const res = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/ai-assistant`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: primed,
            language: selectedLanguage,
            type: "general",
          }),
        }
      );

      if (!res.ok || !res.body) {
        if (res.status === 429) throw new Error("Too many requests. Please wait a moment.");
        if (res.status === 402) throw new Error("AI credits exhausted. Please add credits.");
        throw new Error("Chat error");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sorry, I couldn't respond. Please try again.";
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages(loadHistory());
  };

  const showQuickPrompts = messages.length <= 1;

  return (
    <>
      <Button
        onClick={() => setOpen((v) => !v)}
        size="lg"
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 p-0 shadow-2xl z-40 bg-primary hover:bg-primary/90"
        aria-label="Open AgroSense chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {open && (
        <div className="fixed bottom-24 right-6 w-[min(420px,calc(100vw-2rem))] h-[min(640px,calc(100vh-7rem))] bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-md">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">AgroSense AI</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Online · Powered by Gemini
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={clearChat} title="Clear chat">
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {m.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>
                <div className={`rounded-2xl px-3 py-2 text-sm max-w-[85%] ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2 prose-pre:my-2">
                      <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  )}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"><Bot className="w-3.5 h-3.5" /></div>
                <div className="rounded-2xl px-3 py-2 bg-muted flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {showQuickPrompts && !loading && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 border-t border-border/50 pt-2">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q.label}
                  onClick={() => sendText(q.text)}
                  className="text-xs px-2.5 py-1.5 rounded-full bg-muted hover:bg-muted/70 transition-colors flex items-center gap-1.5 border border-border"
                >
                  <q.icon className="w-3 h-3" />
                  {q.label}
                </button>
              ))}
            </div>
          )}

          <div className="p-3 border-t border-border flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendText(input)}
              placeholder="Ask about your farm..."
              disabled={loading}
            />
            <Button size="icon" onClick={() => sendText(input)} disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
