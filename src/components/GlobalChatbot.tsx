import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircle, X, Send, Loader2, Bot, User, Leaf, Trash2,
  Sprout, Bug, CloudRain, Droplets, FlaskConical,
  Mic, MicOff, Paperclip, ImageIcon, Volume2, VolumeX, Sparkles,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useVoiceInput } from "@/hooks/useVoiceInput";

type Part = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
interface Msg {
  role: "user" | "assistant";
  content: string;          // displayed text
  images?: string[];        // data URLs attached by user
}

const STORAGE_KEY = "agrosense_chat_history_v3";

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
  { icon: Sprout, label: "Best crop now", text: "Based on my region and the current season, what crop should I plant next and why?" },
  { icon: Bug, label: "Diagnose pest", text: "I see small holes and chewed leaves on my plants. Help me identify the pest and the safest treatment." },
  { icon: CloudRain, label: "Weather plan", text: "Give me a 7-day farm action plan based on typical weather for this time of year." },
  { icon: Droplets, label: "Irrigation", text: "Build me an efficient irrigation schedule that saves water." },
  { icon: FlaskConical, label: "Fertilizer", text: "Recommend an NPK fertilizer plan with dosage and timing for my main crop." },
  { icon: ImageIcon, label: "Scan a leaf 📷", text: "I'm uploading a photo of my crop. Please diagnose any disease or pest issues and recommend treatment." },
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
    content:
      "👋 **Welcome to AgroSense AI Pro!**\n\nI'm your intelligent farm copilot with **vision, voice & memory**. I can help with:\n\n- 🌱 Crop selection, rotation & yield\n- 🐛 Pest & disease diagnosis (📷 *upload a photo*)\n- 💧 Irrigation & water management\n- 🧪 Soil health, fertilizer & PPE\n- 🌦️ Weather-based decisions\n- 🐄 Livestock care & feed\n- 💰 Finance, subsidies & carbon credits\n\n**Try voice 🎤, upload a leaf photo 📎, or pick a quick action below.**",
  }];
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function GlobalChatbot() {
  const { selectedLanguage } = useLanguage();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(loadHistory);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [speakReplies, setSpeakReplies] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { isListening, isSupported: voiceSupported, toggleListening } = useVoiceInput({
    onResult: (t) => setInput((prev) => (prev ? prev + " " : "") + t),
    language: "en-US",
  });

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open, loading]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40))); } catch { /* ignore */ }
  }, [messages]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);

  const speak = (text: string) => {
    if (!speakReplies || typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text.replace(/[#*_`>]/g, "").slice(0, 600));
      utter.rate = 1;
      window.speechSynthesis.speak(utter);
    } catch { /* ignore */ }
  };

  const stop = () => { abortRef.current?.abort(); setLoading(false); };

  const sendText = async (text: string, imageUrls: string[] = pendingImages) => {
    const trimmed = text.trim();
    if ((!trimmed && imageUrls.length === 0) || loading) return;
    setInput("");
    setPendingImages([]);
    const userMsg: Msg = { role: "user", content: trimmed || "(image attached)", images: imageUrls.length ? imageUrls : undefined };
    const next: Msg[] = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const hint = ROUTE_HINTS[location.pathname];
      // Build payload — convert messages, attach images as multimodal parts
      const payloadMessages = next.slice(-12).map((m) => {
        if (m.role === "user" && m.images && m.images.length) {
          const parts: Part[] = [
            { type: "text", text: m.content || "Please analyze this image." },
            ...m.images.map((url) => ({ type: "image_url" as const, image_url: { url } })),
          ];
          return { role: "user", content: parts };
        }
        return { role: m.role, content: m.content };
      });
      if (hint) payloadMessages.unshift({ role: "user", content: `Context: ${hint}` });

      const res = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/ai-assistant`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: payloadMessages,
            language: selectedLanguage,
            type: imageUrls.length ? "disease_detection" : "general",
          }),
          signal: ctrl.signal,
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
      if (acc) speak(acc);
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setMessages((m) => [...m, { role: "assistant", content: "⏹️ Response stopped." }]);
      } else {
        const msg = e instanceof Error ? e.message : "Sorry, I couldn't respond. Please try again.";
        setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${msg}` }]);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const onPickFiles = async (files: FileList | null) => {
    if (!files) return;
    const urls: string[] = [];
    for (const f of Array.from(files).slice(0, 3)) {
      if (!f.type.startsWith("image/")) continue;
      urls.push(await fileToDataUrl(f));
    }
    setPendingImages((p) => [...p, ...urls].slice(0, 3));
  };

  const clearChat = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages(loadHistory());
    setPendingImages([]);
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
        <div className="fixed bottom-24 right-6 w-[min(440px,calc(100vw-2rem))] h-[min(680px,calc(100vh-7rem))] bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-md relative">
                <Leaf className="w-5 h-5 text-primary-foreground" />
                <Sparkles className="w-3 h-3 text-secondary absolute -top-0.5 -right-0.5" />
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">AgroSense AI Pro</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Vision · Voice · Memory
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => setSpeakReplies((s) => !s)} title={speakReplies ? "Mute replies" : "Speak replies"}>
                {speakReplies ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4" />}
              </Button>
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
                  {m.images && m.images.length > 0 && (
                    <div className="flex gap-1.5 mb-2 flex-wrap">
                      {m.images.map((u, idx) => (
                        <img key={idx} src={u} alt="" className="w-20 h-20 object-cover rounded-lg border border-border" />
                      ))}
                    </div>
                  )}
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

          {pendingImages.length > 0 && (
            <div className="px-3 pb-2 flex gap-1.5 border-t border-border/50 pt-2 flex-wrap">
              {pendingImages.map((u, i) => (
                <div key={i} className="relative">
                  <img src={u} alt="" className="w-14 h-14 object-cover rounded-lg border border-border" />
                  <button
                    onClick={() => setPendingImages((p) => p.filter((_, idx) => idx !== i))}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    aria-label="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 border-t border-border flex gap-1.5 items-center">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { onPickFiles(e.target.files); e.target.value = ""; }}
            />
            <Button size="icon" variant="ghost" onClick={() => fileRef.current?.click()} title="Attach image" disabled={loading}>
              <Paperclip className="w-4 h-4" />
            </Button>
            {voiceSupported && (
              <Button
                size="icon"
                variant={isListening ? "default" : "ghost"}
                onClick={toggleListening}
                title={isListening ? "Stop listening" : "Voice input"}
                disabled={loading}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendText(input)}
              placeholder={isListening ? "🎤 Listening..." : "Ask about your farm..."}
              disabled={loading}
            />
            {loading ? (
              <Button size="icon" variant="destructive" onClick={stop} title="Stop">
                <X className="w-4 h-4" />
              </Button>
            ) : (
              <Button size="icon" onClick={() => sendText(input)} disabled={!input.trim() && pendingImages.length === 0}>
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
