import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const {
      product,
      activeIngredient,
      dosage,
      crop,
      growthStage,
      applicationMethod,
      waterSources,
      existingTreatments,
      location,
      language,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const langInstruction =
      language && language !== "English"
        ? `Respond entirely in ${language}.`
        : "";

    const prompt = `You are an agricultural pesticide safety expert (PNG smallholder context). Evaluate the proposed treatment and return STRICT JSON.

${langInstruction}

PROPOSED TREATMENT:
- Product: ${product || "Unknown"}
- Active ingredient: ${activeIngredient || "Unknown"}
- Dosage: ${dosage || "Not specified"}
- Application method: ${applicationMethod || "Not specified"}
- Crop: ${crop || "Unknown"} (stage: ${growthStage || "Unknown"})
- Location: ${location || "PNG"}

NEARBY WATER SOURCES (with distance in meters):
${(waterSources || []).map((w: any) => `- ${w.type} at ${w.distanceMeters}m`).join("\n") || "- None reported"}

EXISTING TREATMENTS APPLIED RECENTLY:
${(existingTreatments || []).map((t: any) => `- ${t.product} (${t.activeIngredient || "?"}) applied ${t.daysAgo} days ago`).join("\n") || "- None"}

In addition to the safety verdict, run a TANK-MIX COMPATIBILITY ANALYSIS:
- Compare the planned product against each treatment applied in the last 30 days (above).
- Detect chemical incompatibilities (e.g., alkaline + acidic, copper + sulfur, EC + WP precipitation, antagonism, phytotoxicity).
- Detect timing/residual incompatibilities (carryover, wait intervals, resistance management).
- Produce a safe MIXING PLAN with the correct fill order (W.A.L.E.S. or similar), jar-test guidance, water pH/hardness advice, and adjuvants.

Return JSON:
{
  "overallRisk": "low|moderate|high|critical",
  "safeToProceed": true,
  "summary": "1-2 sentence verdict",
  "dosageCheck": {
    "status": "ok|too_low|too_high|unclear",
    "recommendedDosage": "e.g. 2 ml/L",
    "notes": "Why"
  },
  "waterSourceWarnings": [
    { "source": "Stream", "distanceMeters": 15, "requiredBufferMeters": 30, "severity": "high", "message": "..." }
  ],
  "restrictions": [
    { "type": "REI|PHI|legal|crop_stage|weather", "title": "...", "detail": "...", "severity": "low|moderate|high" }
  ],
  "compatibility": [
    { "withProduct": "...", "status": "compatible|wait|incompatible", "waitDays": 0, "reason": "..." }
  ],
  "tankMix": {
    "overallVerdict": "safe|caution|do_not_mix",
    "summary": "Plain-language verdict on mixing planned product with recent sprays.",
    "incompatibilities": [
      {
        "withProduct": "Product from last 30 days",
        "activeIngredient": "...",
        "daysAgo": 5,
        "type": "chemical|physical|biological|timing|resistance|phytotoxic",
        "severity": "low|moderate|high|critical",
        "reason": "Why they clash (e.g. copper precipitates with EC formulations).",
        "mitigation": "What to do instead (skip mix, wait N days, split sprays, rinse tank).",
        "minWaitDays": 0
      }
    ],
    "doNotMixWith": ["Active ingredient or class to avoid"],
    "safeMixingPlan": {
      "canMixTogether": ["Product A", "Product B"],
      "waterPh": "5.5-6.5",
      "waterVolumePerTank": "e.g. 15L knapsack",
      "fillOrderSteps": [
        { "step": 1, "action": "Half-fill tank with clean water and start agitation", "product": "", "notes": "" },
        { "step": 2, "action": "Add water conditioner / buffer if water is hard or alkaline", "product": "", "notes": "" },
        { "step": 3, "action": "Add WG/WP/SP (wettable powders)", "product": "...", "notes": "" },
        { "step": 4, "action": "Add SC/SE/OD (suspensions)", "product": "...", "notes": "" },
        { "step": 5, "action": "Add EC/SL (liquids)", "product": "...", "notes": "" },
        { "step": 6, "action": "Add adjuvants/surfactants last and top up water", "product": "...", "notes": "" }
      ],
      "jarTest": {
        "required": true,
        "instructions": "In a clean jar, mix products at the same proportion as the tank. Shake, wait 15 min. Reject if curdling, oil layer, sludge, or temperature change."
      },
      "adjuvants": [
        { "name": "Non-ionic surfactant", "purpose": "Improve leaf coverage", "rate": "0.5 ml/L" }
      ],
      "sprayWithin": "Spray within 2 hours of mixing. Do not store mixed solution."
    }
  },
  "ppe": ["Gloves", "Mask", "Long sleeves"],
  "buffers": { "waterMeters": 30, "beehiveMeters": 50, "dwellingMeters": 20 },
  "preHarvestIntervalDays": 7,
  "reEntryIntervalHours": 24,
  "saferAlternatives": [
    { "name": "...", "type": "organic|biological|cultural", "reason": "..." }
  ],
  "actionChecklist": [
    "Step 1...",
    "Step 2..."
  ]
}

Return ONLY valid JSON.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!r.ok) {
      if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (r.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await r.text();
      console.error("AI error", r.status, t);
      throw new Error("AI service error");
    }

    const data = await r.json();
    const content = data.choices?.[0]?.message?.content || "";
    const m = content.match(/\{[\s\S]*\}/);
    let result;
    try {
      result = m ? JSON.parse(m[0]) : null;
    } catch {
      result = null;
    }
    if (!result) {
      result = {
        overallRisk: "moderate",
        safeToProceed: false,
        summary: "Could not fully evaluate. Consult local extension officer.",
        dosageCheck: { status: "unclear", recommendedDosage: "", notes: "" },
        waterSourceWarnings: [],
        restrictions: [],
        compatibility: [],
        ppe: ["Gloves", "Mask"],
        buffers: { waterMeters: 30, beehiveMeters: 50, dwellingMeters: 20 },
        preHarvestIntervalDays: 7,
        reEntryIntervalHours: 24,
        saferAlternatives: [],
        actionChecklist: ["Re-check inputs", "Consult expert"],
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("safety-checker error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
