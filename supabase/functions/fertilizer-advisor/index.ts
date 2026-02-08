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
    const { cropType, growthStage, soilType, fieldSize, location } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Fertilizer advisor request:", { cropType, growthStage, soilType, fieldSize, location });

    const prompt = `As an expert agricultural scientist, provide a detailed fertilizer and nutrient management plan for:

Crop: ${cropType}
Growth Stage: ${growthStage}
Soil Type: ${soilType || 'Not specified'}
Field Size: ${fieldSize || '1'} hectares
Location: ${location || 'India'}

Provide the response in this exact JSON format:
{
  "nutrientLevels": {
    "nitrogen": {"current": 45, "optimal": 60, "status": "low|good|excess", "action": "Brief action needed"},
    "phosphorus": {"current": 55, "optimal": 50, "status": "low|good|excess", "action": "Brief action needed"},
    "potassium": {"current": 35, "optimal": 55, "status": "low|good|excess", "action": "Brief action needed"}
  },
  "recommendations": [
    {
      "nutrient": "Nitrogen (N)",
      "product": "Product Name (% composition)",
      "quantity": "XX kg/hectare",
      "timing": "When to apply",
      "method": "How to apply",
      "cost": "₹XXX",
      "priority": "high|medium|low"
    }
  ],
  "schedule": [
    {"week": "Week 1", "action": "What to do", "status": "current|upcoming|scheduled"}
  ],
  "totalCostPerHectare": 1500,
  "expectedYieldBoost": "15-20%",
  "organicAlternatives": [
    {"name": "Alternative name", "benefit": "Why use it", "application": "How to apply"}
  ],
  "warnings": ["Any important warnings or cautions"]
}

Be specific to ${cropType} at ${growthStage} stage. Use Indian market prices. Include 3-4 fertilizer recommendations, 4-6 week schedule, and 2-3 organic alternatives. Return ONLY valid JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI service error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to generate fertilizer plan. Please try again.");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Fertilizer advisor error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
