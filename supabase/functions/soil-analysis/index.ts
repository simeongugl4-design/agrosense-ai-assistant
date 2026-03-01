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
    const { imageBase64, location, currentCrops, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const langInstruction = language && language !== "English" 
      ? `IMPORTANT: Respond entirely in ${language}. All text, descriptions, and recommendations must be in ${language}.` 
      : "";

    const messages: any[] = [];
    
    if (imageBase64) {
      messages.push({
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
            }
          },
          {
            type: "text",
            text: `You are an expert agricultural soil scientist. Analyze this soil photo and provide a comprehensive soil analysis.
${langInstruction}
${location ? `Location: ${location}` : ''}
${currentCrops ? `Current crops: ${currentCrops}` : ''}

Provide analysis in this JSON format:
{
  "soilType": "Identified soil type",
  "color": "Soil color description",
  "texture": "Soil texture (sandy/clay/loamy/silty etc.)",
  "moisture": "Estimated moisture level (Low/Medium/High)",
  "organicMatter": "Estimated organic matter content (Low/Medium/High)",
  "phEstimate": "Estimated pH range (e.g. 6.0-6.5)",
  "healthScore": 75,
  "nutrients": {
    "nitrogen": { "level": "Low/Medium/High", "status": "Deficient/Adequate/Excess" },
    "phosphorus": { "level": "Low/Medium/High", "status": "Deficient/Adequate/Excess" },
    "potassium": { "level": "Low/Medium/High", "status": "Deficient/Adequate/Excess" },
    "calcium": { "level": "Low/Medium/High", "status": "Deficient/Adequate/Excess" },
    "magnesium": { "level": "Low/Medium/High", "status": "Deficient/Adequate/Excess" },
    "sulfur": { "level": "Low/Medium/High", "status": "Deficient/Adequate/Excess" }
  },
  "enrichmentRecommendations": [
    {
      "nutrient": "Nutrient name",
      "product": "Specific product/fertilizer name",
      "quantity": "Amount per hectare",
      "method": "How to apply",
      "timing": "When to apply",
      "cost": "Estimated cost"
    }
  ],
  "cropRecommendations": [
    {
      "crop": "Crop name",
      "suitability": 90,
      "reason": "Why this soil is suitable",
      "tips": "Growing tips for this soil"
    }
  ],
  "improvements": [
    "Improvement suggestion 1",
    "Improvement suggestion 2"
  ],
  "warnings": ["Any issues found"]
}

Return ONLY valid JSON.`
          }
        ]
      });
    } else {
      return new Response(JSON.stringify({ error: "Image is required for soil analysis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
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
      throw new Error("AI service error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      console.error("Failed to parse:", content);
      analysis = {
        soilType: "Analysis Pending",
        color: "Unable to determine",
        texture: "Unknown",
        moisture: "Unknown",
        organicMatter: "Unknown",
        phEstimate: "6.0-7.0",
        healthScore: 50,
        nutrients: {},
        enrichmentRecommendations: [],
        cropRecommendations: [],
        improvements: ["Please provide a clearer soil image"],
        warnings: ["AI could not confidently analyze this image"]
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Soil analysis error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
