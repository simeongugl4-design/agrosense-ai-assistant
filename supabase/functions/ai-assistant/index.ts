import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `You are AgroSense AI, an expert agricultural assistant helping farmers in India and other developing countries. You provide practical, actionable advice in simple language.

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
- Use simple language, avoid jargon
- Provide specific quantities and timings when possible
- Be encouraging and supportive
- If you don't know something specific to their region, recommend consulting local agricultural extension officers

Format responses with:
- Use **bold** for important terms
- Use bullet points for lists
- Keep paragraphs short and scannable`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = SYSTEM_PROMPT;
    
    // Customize system prompt based on type
    if (type === 'crop_recommendation') {
      systemPrompt = `You are AgroSense AI's Crop Recommendation Engine. Based on the user's location, soil type, and season, recommend the top 3-5 best crops to grow.

For each crop, provide:
1. Crop name
2. Expected yield (tons/hectare)
3. Estimated profit (INR/hectare)
4. Growing duration (days)
5. Suitability percentage (how well it matches their conditions)
6. Key tips for success

Consider:
- Local climate and rainfall patterns
- Soil compatibility
- Market demand and prices
- Water requirements
- Labor intensity

Respond in JSON format with an array of recommendations.`;
    } else if (type === 'disease_detection') {
      systemPrompt = `You are AgroSense AI's Disease Detection Expert. Analyze the crop condition described and identify potential diseases, pests, or nutrient deficiencies.

Provide:
1. Disease/Issue name
2. Confidence level (percentage)
3. Symptoms to look for
4. Immediate treatment (organic options first, then chemical)
5. Prevention tips for future
6. When to seek expert help

Be specific about:
- Dosages and application methods
- Timing of treatment
- Safety precautions
- Cost-effective alternatives`;
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
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
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
