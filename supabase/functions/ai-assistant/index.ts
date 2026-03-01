import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, type, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const langInstruction = language && language !== "English" 
      ? `\n\nCRITICAL: You MUST respond ENTIRELY in ${language}. Every word must be in ${language}. Use agricultural terminology in ${language}.` 
      : "";

    let systemPrompt = `You are AgroSense AI, an expert agricultural assistant helping farmers worldwide. You provide practical, actionable advice in simple language. Use proper agricultural terminology.

Your expertise includes:
- Crop selection and rotation based on soil, climate, and season
- Disease and pest identification and treatment (organic + chemical options)
- Irrigation and water management
- Fertilizer recommendations and soil health
- Weather-based farming decisions
- Market prices and selling strategies
- Government schemes and subsidies

Guidelines:
- Give clear, step-by-step advice
- Suggest both organic and chemical solutions when relevant
- Consider the farmer's budget and resources
- Use proper agricultural terminology
- Provide specific quantities and timings
- Be encouraging and supportive

Format responses with:
- Use **bold** for important terms
- Use bullet points for lists
- Keep paragraphs short and scannable${langInstruction}`;
    
    if (type === 'crop_recommendation') {
      systemPrompt = `You are AgroSense AI's Crop Recommendation Engine.${langInstruction}`;
    } else if (type === 'disease_detection') {
      systemPrompt = `You are AgroSense AI's Disease Detection Expert.${langInstruction}`;
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
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI assistant error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
