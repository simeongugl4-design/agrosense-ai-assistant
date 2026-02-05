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
    const { location, soilType, season, farmSize } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `As an agricultural AI expert, analyze these farming conditions and recommend the best crops:

Location: ${location}
Soil Type: ${soilType}
Season: ${season}
Farm Size: ${farmSize || 'Not specified'}

Provide exactly 4 crop recommendations in this JSON format:
{
  "recommendations": [
    {
      "crop": "Crop Name",
      "yieldEstimate": "X.X tons/hectare",
      "profit": "₹XX,XXX/hectare",
      "duration": "XX-XX days",
      "suitability": 95,
      "waterNeeds": "Low/Medium/High",
      "tips": "Key growing advice for this specific location and soil",
      "sowingWindow": "Best months to sow",
      "harvestTime": "Expected harvest period"
    }
  ]
}

Consider:
- Regional climate patterns for ${location}
- ${soilType} soil characteristics and what grows well in it
- ${season} season requirements
- Current market demand and prices in India
- Water availability typical for the region

Return ONLY valid JSON, no additional text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI service error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    // Parse the JSON from the response
    let recommendations;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Return fallback recommendations
      recommendations = {
        recommendations: [
          {
            crop: "Rice",
            yieldEstimate: "4.5 tons/hectare",
            profit: "₹45,000/hectare",
            duration: "120-150 days",
            suitability: 90,
            waterNeeds: "High",
            tips: "Suitable for the given conditions. Ensure proper irrigation.",
            sowingWindow: "June-July",
            harvestTime: "October-November"
          },
          {
            crop: "Wheat",
            yieldEstimate: "3.5 tons/hectare",
            profit: "₹35,000/hectare",
            duration: "100-120 days",
            suitability: 85,
            waterNeeds: "Medium",
            tips: "Good choice for rabi season. Requires well-drained soil.",
            sowingWindow: "November-December",
            harvestTime: "March-April"
          }
        ]
      };
    }

    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Crop advisor error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
