import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const stripCodeFences = (value: string) => value.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { language = "English", country = "", payload } = await req.json();

    if (!payload || typeof payload !== "object") {
      return new Response(JSON.stringify({ error: "A payload object is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (typeof language !== "string" || !language.trim() || language.trim() === "English") {
      return new Response(JSON.stringify({ translations: payload }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Translate every string value inside the following JSON into ${language.trim()}${country ? ` for farmers in ${country}` : ""}.

Rules:
- Return ONLY valid JSON.
- Keep the exact same keys and structure.
- Do not add or remove keys.
- Preserve placeholders like {language}, {country}, {voiceLocale}, {count}, {value}, {size}, {min}, {max}, {family}, {stage} exactly.
- Preserve emojis, units, and product names when helpful.
- Keep brand names like AgroSenseAI, AI, JPG, PNG, WEBP unchanged.

JSON:
${JSON.stringify(payload)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a localization engine for an agricultural dashboard. Return only JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("UI translation error:", response.status, text);
      throw new Error("Failed to translate dashboard copy");
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error("No translation content returned");
    }

    const translations = JSON.parse(stripCodeFences(rawContent));

    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ui-translations error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
