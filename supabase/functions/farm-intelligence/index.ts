import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SCHEMAS: Record<string, string> = {
  pest: `{"pest":"name","scientificName":"...","confidence":0-100,"severity":"low|moderate|high|critical","riskScore":0-100,"earlyWarning":"text","damageSymptoms":["..."],"treatments":[{"type":"organic|chemical|biological","product":"...","dosage":"...","timing":"...","cost":"..."}],"prevention":["..."],"spreadRisk":"text","economicImpact":"text"}`,
  satellite: `{"ndvi":{"current":0-1,"average":0-1,"trend":"improving|stable|declining"},"healthScore":0-100,"healthStatus":"excellent|good|fair|poor","waterStress":{"level":"none|mild|moderate|severe","affectedHectares":number},"growthStage":"...","vegetationZones":[{"zone":"north|south|east|west|center","ndvi":0-1,"status":"text"}],"anomalies":[{"type":"...","severity":"...","action":"..."}],"recommendations":["..."],"forecast":"text"}`,
  yield: `{"predictedYieldTonsPerHa":number,"confidence":0-100,"totalHarvest":"text","revenue":{"low":number,"expected":number,"high":number,"currency":"USD"},"marketPriceForecast":{"now":number,"in30Days":number,"in90Days":number,"trend":"up|stable|down"},"profitability":{"costs":number,"gross":number,"net":number,"marginPct":number},"comparedToRegion":"text","riskFactors":["..."],"optimizations":[{"action":"...","yieldGainPct":number}]}`,
  livestock: `{"herdHealthScore":0-100,"alerts":[{"animalId":"...","issue":"...","severity":"low|moderate|high","action":"..."}],"feedOptimization":{"currentCostPerHead":number,"recommendedCostPerHead":number,"savings":"text","feedMix":["..."]},"breeding":{"readyCount":number,"nextWindow":"text","fertilityScore":0-100},"anomalies":[{"type":"...","description":"..."}],"recommendations":["..."]}`,
  finance: `{"creditScore":0-1000,"creditTier":"poor|fair|good|excellent","loanEligibility":{"maxAmount":number,"interestRangePct":"...","tenure":"..."},"profitability":{"revenueYTD":number,"costsYTD":number,"netYTD":number,"marginPct":number},"riskAssessment":{"climate":"low|moderate|high","market":"low|moderate|high","operational":"low|moderate|high","overall":"low|moderate|high"},"recommendations":["..."],"recommendedLenders":[{"name":"...","product":"...","ratePct":number,"fit":"text"}]}`,
  carbon: `{"sequesteredTonsCO2":number,"creditsEarned":number,"creditValueUSD":number,"sustainabilityScore":0-100,"esgRating":"A+|A|B|C|D","practices":[{"name":"...","impactTons":number,"status":"active|recommended"}],"recommendations":["..."],"verificationStatus":"text","marketplaces":[{"name":"...","pricePerTon":number}]}`,
  subsidies: `{"eligiblePrograms":[{"name":"...","provider":"...","amount":"...","matchScore":0-100,"deadline":"...","requirements":["..."],"applicationSteps":["..."]}],"totalPotentialUSD":number,"recommendations":["..."]}`,
  alerts: `{"alerts":[{"id":"...","type":"disease|pest|weather|market|irrigation|soil","severity":"info|warning|critical","title":"...","message":"...","action":"...","timeWindow":"...","affectedArea":"..."}],"summary":"text","priorityCount":{"critical":number,"warning":number,"info":number}}`,
};

const SYSTEM_PROMPTS: Record<string, string> = {
  pest: "You are an entomologist and IPM expert. Identify the pest and recommend integrated pest management.",
  satellite: "You are a remote-sensing agronomist analyzing NDVI/vegetation indices from satellite imagery.",
  yield: "You are an agricultural economist forecasting yield, market prices, and profitability.",
  livestock: "You are a veterinary livestock specialist analyzing herd health and productivity.",
  finance: "You are an agricultural finance analyst evaluating farm creditworthiness and profitability.",
  carbon: "You are a sustainability and carbon-credit verification expert for regenerative agriculture.",
  subsidies: "You are an agricultural policy advisor matching farmers with government subsidies and grants.",
  alerts: "You are an AI farm operations center generating prioritized, actionable alerts.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { module, context = {}, language = "English" } = await req.json();
    if (!module || !SCHEMAS[module]) {
      return new Response(JSON.stringify({ error: "Invalid module" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const langLine = language !== "English" ? `Respond entirely in ${language}.` : "";

    const prompt = `${SYSTEM_PROMPTS[module]}
${langLine}

FARMER CONTEXT (use realistic, location-appropriate values):
${JSON.stringify(context, null, 2)}

Generate a realistic, well-reasoned AI analysis. Return STRICT JSON matching this schema:
${SCHEMAS[module]}

Return ONLY the JSON object, no markdown, no explanation.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error", response.status, t);
      if (response.status === 429)
        return new Response(JSON.stringify({ error: "Rate limit. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (response.status === 402)
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      throw new Error("AI service error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in AI response");
    const result = JSON.parse(match[0]);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("farm-intelligence error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
