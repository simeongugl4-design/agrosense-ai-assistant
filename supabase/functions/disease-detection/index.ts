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
    const { imageBase64, cropType, symptoms } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the message with image if provided
    const messages: any[] = [];
    
    if (imageBase64) {
      // Use vision capability with image
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
            text: `Analyze this crop image for diseases, pests, or nutrient deficiencies.
${cropType ? `Crop type: ${cropType}` : ''}
${symptoms ? `Reported symptoms: ${symptoms}` : ''}

Provide analysis in this JSON format:
{
  "disease": "Disease/Issue Name",
  "confidence": 85,
  "severity": "Mild/Moderate/Severe",
  "symptoms": ["symptom 1", "symptom 2"],
  "treatment": {
    "organic": "Organic treatment options with dosages",
    "chemical": "Chemical treatment options with dosages",
    "immediate": "What to do right now"
  },
  "prevention": "How to prevent this in future",
  "expertNeeded": false,
  "expertReason": "When to consult an expert"
}

Return ONLY valid JSON.`
          }
        ]
      });
    } else {
      // Text-only analysis based on symptoms
      messages.push({
        role: "user",
        content: `As an agricultural disease expert, analyze these crop symptoms:

Crop Type: ${cropType || 'Unknown'}
Reported Symptoms: ${symptoms || 'No symptoms described'}

Provide diagnosis in this JSON format:
{
  "disease": "Most Likely Disease/Issue",
  "confidence": 75,
  "severity": "Mild/Moderate/Severe",
  "symptoms": ["symptom 1", "symptom 2"],
  "treatment": {
    "organic": "Organic treatment options with dosages",
    "chemical": "Chemical treatment options with dosages",
    "immediate": "What to do right now"
  },
  "prevention": "How to prevent this in future",
  "expertNeeded": false,
  "expertReason": "When to consult an expert",
  "possibleAlternatives": ["Other possible causes"]
}

Return ONLY valid JSON.`
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash", // Using flash for vision capability
        messages,
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
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Return a structured error response
      analysis = {
        disease: "Analysis Inconclusive",
        confidence: 50,
        severity: "Unknown",
        symptoms: ["Please provide clearer image or more details"],
        treatment: {
          organic: "Consult local agricultural officer for accurate diagnosis",
          chemical: "Do not apply chemicals without proper diagnosis",
          immediate: "Isolate affected plants if possible"
        },
        prevention: "Regular monitoring and early detection helps prevent spread",
        expertNeeded: true,
        expertReason: "AI could not make a confident diagnosis"
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Disease detection error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
