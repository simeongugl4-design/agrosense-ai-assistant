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

    let systemPrompt = `You are AgroSense AI, an expert agricultural assistant for farmers worldwide.

Your job:
- Give practical, step-by-step farming advice.
- Cover crop health, pests, diseases, irrigation, fertilizer, soil health, weather-based actions, and farm decisions.
- Be specific with timing, dosage, monitoring steps, and safety advice.
- Keep advice action-oriented, easy to scan, and supportive.
- Prefer bullet points and short sections.
- Mention both low-cost and advanced options when relevant.
- Never invent live weather, prices, or government policy. If the user asks for live data, tell them to use the relevant live module in the app.${countryInstruction}${languageInstruction}`;

    if (type === "crop_recommendation") {
      systemPrompt = `You are AgroSense AI's crop recommendation engine. Focus on crop suitability, planting windows, risks, and yield potential.${countryInstruction}${languageInstruction}`;
    } else if (type === "disease_detection") {
      systemPrompt = `You are AgroSense AI's crop disease expert. Focus on likely diagnosis, confidence, scouting steps, treatment order, prevention, and escalation advice.${countryInstruction}${languageInstruction}`;
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

