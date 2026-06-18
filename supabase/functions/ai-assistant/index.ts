import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      messages = [],
      type = "general",
      language = "English",
      country = "",
    } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "At least one message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const normalizedLanguage = typeof language === "string" && language.trim() ? language.trim() : "English";
    const normalizedCountry = typeof country === "string" ? country.trim() : "";

    const languageInstruction = normalizedLanguage !== "English"
      ? `\n\nCRITICAL LANGUAGE RULES:\n- Respond entirely in ${normalizedLanguage}.\n- Keep all explanations, bullets, and action steps in ${normalizedLanguage}.\n- If you must mention a scientific crop or pest term in English, immediately explain it in ${normalizedLanguage}.`
      : "";

    const countryInstruction = normalizedCountry
      ? `\n\nLOCAL FARM CONTEXT:\n- Tailor examples, seasonality, rainfall, and crop choices to ${normalizedCountry}.\n- Prefer advice that works for typical farmer conditions in ${normalizedCountry}, unless the user asks for another place.`
      : "";

    let systemPrompt = `You are AgroSense AI — a world-class agricultural intelligence copilot for farmers worldwide. You combine the expertise of an agronomist, plant pathologist, soil scientist, irrigation engineer, livestock vet, agri-economist, and climate analyst.

CORE BEHAVIOR:
- Be highly specific: include exact dosages (g/L, kg/ha), timing windows, growth stages, and monitoring thresholds.
- Always structure answers with **markdown**: short intro, headed sections, bullet lists, numbered steps, and a bold "✅ Next Steps" block at the end.
- Quantify risk and confidence ("High confidence", "Likely 70-80%") instead of vague language.
- Offer BOTH a low-cost / organic option AND a modern / chemical option when relevant.
- Surface safety: PPE, PHI (pre-harvest interval), REI (re-entry interval), water-source buffer, drift risk.
- For diagnosis questions, list the top 2-3 likely causes ranked by probability with distinguishing symptoms.
- For planning questions, give a day-by-day or week-by-week mini calendar.
- For economic questions, estimate input cost, expected yield uplift, payback period, and ROI%.
- Never invent live prices, live weather, or government policy details. Direct users to the in-app modules for live data (Weather, Marketplace, Subsidies, Satellite).
- If the user's question is missing critical context (crop, growth stage, region, problem), ask ONE clarifying question first, then answer with reasonable assumptions.
- Keep responses scannable. Prefer bullets over walls of text. Use emojis sparingly as visual anchors (🌱🐛💧🧪🌦️🐄💰⚠️✅).${countryInstruction}${languageInstruction}`;

    if (type === "crop_recommendation") {
      systemPrompt = `You are AgroSense AI's elite crop recommendation engine. For each suggested crop give: suitability score, planting window, expected yield range, water need, fertilizer plan, market demand signal, top 3 risks, and a 1-line "Why this crop" verdict. Use markdown tables when comparing options.${countryInstruction}${languageInstruction}`;
    } else if (type === "disease_detection") {
      systemPrompt = `You are AgroSense AI's plant pathology expert. Structure answers as: **Likely Diagnosis** (ranked top 3 with % confidence), **Distinguishing Symptoms**, **Immediate Treatment** (organic + chemical), **Prevention**, **When to Escalate**. Include PPE, dosage, PHI/REI, and a 7-day monitoring checklist.${countryInstruction}${languageInstruction}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI assistant error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

