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
    const { imageBase64, cropType, symptoms, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const langInstruction = language && language !== "English" 
      ? `IMPORTANT: Respond entirely in ${language}. All text must be in ${language}.` 
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
            text: `You are an expert agricultural scientist specializing in plant pathology and crop identification. Analyze this leaf/crop image comprehensively.
${langInstruction}
${cropType ? `Farmer says crop type: ${cropType}` : ''}
${symptoms ? `Reported symptoms: ${symptoms}` : ''}

Provide a COMPLETE analysis in this JSON format:
{
  "cropIdentification": {
    "name": "Identified crop name",
    "scientificName": "Latin name",
    "family": "Plant family",
    "growthStage": "Current growth stage",
    "overallHealth": "Healthy/Stressed/Diseased/Critical"
  },
  "disease": "Disease/Issue Name (or 'Healthy' if none found)",
  "confidence": 85,
  "confidenceBreakdown": {
    "visualMatch": 90,
    "symptomMatch": 80,
    "contextMatch": 75,
    "rationale": "1-2 sentence explanation of why this confidence level"
  },
  "severity": "Mild/Moderate/Severe/None",
  "symptoms": ["Visible symptom 1", "Visible symptom 2"],
  "differentialDiagnoses": [
    { "name": "Alternative disease 1", "confidence": 60, "distinguishingFeature": "How to tell apart" },
    { "name": "Alternative disease 2", "confidence": 40, "distinguishingFeature": "How to tell apart" }
  ],
  "similarCases": [
    { "scenario": "Realistic farmer case (region/crop/conditions)", "outcome": "What worked", "timeToRecover": "e.g. 2 weeks" },
    { "scenario": "Another similar case", "outcome": "What worked", "timeToRecover": "e.g. 3 weeks" }
  ],
  "diseaseInfo": {
    "causedBy": "Pathogen/Pest/Deficiency name",
    "type": "Fungal/Bacterial/Viral/Pest/Nutrient Deficiency",
    "spreadMethod": "How it spreads",
    "affectedParts": ["leaves", "stems", "roots"],
    "progressionRate": "Slow/Moderate/Fast"
  },
  "treatment": {
    "immediate": "What to do RIGHT NOW",
    "stepByStep": [
      { "step": 1, "title": "Short action title", "action": "Detailed action", "timing": "Day 1 / morning / etc.", "materials": ["item 1", "item 2"], "expectedOutcome": "What you should observe" },
      { "step": 2, "title": "...", "action": "...", "timing": "Day 2-3", "materials": [], "expectedOutcome": "..." },
      { "step": 3, "title": "...", "action": "...", "timing": "Week 1", "materials": [], "expectedOutcome": "..." }
    ],
    "organic": "Organic treatment with exact dosages and application method",
    "chemical": {
      "products": [
        {
          "name": "Chemical product name",
          "activeIngredient": "Active ingredient",
          "dosage": "Exact dosage per liter/hectare",
          "applicationMethod": "Spray/Drench/Soil application",
          "frequency": "How often to apply",
          "waitingPeriod": "Days before harvest after application",
          "safetyPrecautions": "Safety measures"
        }
      ]
    },
    "estimatedRecoveryTime": "e.g. 2-3 weeks with treatment",
    "successRate": 80
  },
  "preventionPlan": {
    "summary": "Short prevention overview",
    "steps": [
      { "step": 1, "title": "...", "action": "...", "timing": "Pre-planting", "frequency": "Once" },
      { "step": 2, "title": "...", "action": "...", "timing": "Vegetative stage", "frequency": "Weekly" },
      { "step": 3, "title": "...", "action": "...", "timing": "Flowering", "frequency": "Bi-weekly" }
    ]
  },
  "prevention": "Short prevention summary (legacy field)",
  "cropInfo": {
    "optimalConditions": "Ideal growing conditions",
    "waterNeeds": "Water requirements",
    "nutrientNeeds": "Key nutrients needed",
    "commonPests": ["Common pest 1", "Common pest 2"],
    "companionPlants": ["Good companion plants"],
    "harvestIndicators": "Signs crop is ready for harvest"
  },
  "expertNeeded": false,
  "expertReason": "When to consult an expert"
}

Return ONLY valid JSON.`
          }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: `You are an expert agricultural scientist. Analyze these crop symptoms:
${langInstruction}

Crop Type: ${cropType || 'Unknown'}
Symptoms: ${symptoms || 'No symptoms described'}

Provide diagnosis in this JSON format:
{
  "cropIdentification": {
    "name": "${cropType || 'Unknown'}",
    "scientificName": "If known",
    "family": "Plant family",
    "growthStage": "Unknown from text",
    "overallHealth": "Potentially Diseased"
  },
  "disease": "Most Likely Disease/Issue",
  "confidence": 70,
  "confidenceBreakdown": { "visualMatch": 0, "symptomMatch": 70, "contextMatch": 60, "rationale": "Based on text only" },
  "severity": "Mild/Moderate/Severe",
  "symptoms": ["symptom 1", "symptom 2"],
  "differentialDiagnoses": [
    { "name": "Alt 1", "confidence": 50, "distinguishingFeature": "..." }
  ],
  "similarCases": [
    { "scenario": "...", "outcome": "...", "timeToRecover": "..." }
  ],
  "diseaseInfo": {
    "causedBy": "Pathogen name",
    "type": "Fungal/Bacterial/Viral/Pest/Nutrient",
    "spreadMethod": "How it spreads",
    "affectedParts": ["affected parts"],
    "progressionRate": "Rate"
  },
  "treatment": {
    "immediate": "What to do now",
    "stepByStep": [
      { "step": 1, "title": "...", "action": "...", "timing": "Day 1", "materials": [], "expectedOutcome": "..." },
      { "step": 2, "title": "...", "action": "...", "timing": "Day 2-3", "materials": [], "expectedOutcome": "..." },
      { "step": 3, "title": "...", "action": "...", "timing": "Week 1", "materials": [], "expectedOutcome": "..." }
    ],
    "organic": "Organic options with dosages",
    "chemical": {
      "products": [
        {
          "name": "Product name",
          "activeIngredient": "Active ingredient",
          "dosage": "Dosage",
          "applicationMethod": "Method",
          "frequency": "Frequency",
          "waitingPeriod": "Waiting period",
          "safetyPrecautions": "Safety"
        }
      ]
    },
    "estimatedRecoveryTime": "e.g. 2 weeks",
    "successRate": 75
  },
  "preventionPlan": {
    "summary": "...",
    "steps": [
      { "step": 1, "title": "...", "action": "...", "timing": "Pre-planting", "frequency": "Once" },
      { "step": 2, "title": "...", "action": "...", "timing": "Vegetative", "frequency": "Weekly" }
    ]
  },
  "prevention": "Prevention tips",
  "cropInfo": {
    "optimalConditions": "Growing conditions",
    "waterNeeds": "Water needs",
    "nutrientNeeds": "Nutrients",
    "commonPests": ["pests"],
    "companionPlants": ["companions"],
    "harvestIndicators": "Harvest signs"
  },
  "expertNeeded": false,
  "expertReason": "When to get expert"
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
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
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
        cropIdentification: { name: "Unknown", scientificName: "", family: "", growthStage: "Unknown", overallHealth: "Unknown" },
        disease: "Analysis Inconclusive",
        confidence: 50,
        severity: "Unknown",
        symptoms: ["Please provide clearer image or more details"],
        diseaseInfo: { causedBy: "Unknown", type: "Unknown", spreadMethod: "Unknown", affectedParts: [], progressionRate: "Unknown" },
        treatment: { immediate: "Isolate affected plants", organic: "Consult local agricultural officer", chemical: { products: [] } },
        prevention: "Regular monitoring helps",
        cropInfo: { optimalConditions: "", waterNeeds: "", nutrientNeeds: "", commonPests: [], companionPlants: [], harvestIndicators: "" },
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
