import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

interface Msg { role: "user" | "assistant"; content: string }

interface Props {
  context?: Record<string, unknown>;
}

export function SafetyChatbot({ context }: Props) {
  const { selectedLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your Safety & Tank-Mix assistant. Ask me about dosages, mixing order, buffer zones, PPE, or whether two products can be sprayed together.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);

    try {
      const ctxLine = context
        ? `\n\nCURRENT SAFETY CHECK CONTEXT (JSON):\n${JSON.stringify(context).slice(0, 4000)}`
        : "";
      const systemPrime: Msg = {
        role: "user",
        content: `You are a pesticide safety and tank-mix advisor for PNG smallholder farmers. Give short, plain-language, step-by-step answers. Always warn about water sources, PPE, PHI/REI, and dangerous mixes. If the user asks about mixing, give the fill order and a jar test.${ctxLine}`,
      };

      const res = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/ai-assistant`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [systemPrime, ...next.slice(-8)],
            language: selectedLanguage,
            type: "general",
          }),
        }
      );

      if (!res.ok || !res.body) throw new Error("Chat error");
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
          } catch {
            /* ignore */
          }
        }
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn't respond. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 p-0 shadow-2xl z-40"
        aria-label="Open safety chat"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {open && (
        <div className="fixed bottom-6 right-6 w-[min(380px,calc(100vw-2rem))] h-[min(560px,calc(100vh-3rem))] bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Safety Assistant</p>
                <p className="text-xs text-muted-foreground">Tank-mix & dosage help</p>
              </div>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {m.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>
                <div className={`rounded-2xl px-3 py-2 text-sm max-w-[80%] whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {m.content || (loading && i === messages.length - 1 ? "…" : "")}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="p-3 border-t border-border flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about mixing, PPE, dosage..."
              disabled={loading}
            />
            <Button size="icon" onClick={send} disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
