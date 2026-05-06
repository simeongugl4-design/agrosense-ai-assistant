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
      caseSummary,
      crop,
      disease,
      initialSeverity,
      daysSinceStart,
      daysSinceLastFollowup,
      previousFollowups,
      newPhotoBase64,
      farmerNotes,
      farmerProgressRating,
      language,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const langInstruction =
      language && language !== "English"
        ? `IMPORTANT: Respond entirely in ${language}.`
        : "";

    const content: any[] = [];
    if (newPhotoBase64) {
      content.push({
        type: "image_url",
        image_url: {
          url: newPhotoBase64.startsWith("data:")
            ? newPhotoBase64
            : `data:image/jpeg;base64,${newPhotoBase64}`,
        },
      });
    }
    content.push({
      type: "text",
      text: `You are a plant pathology expert evaluating PROGRESS on an ongoing disease case.
${langInstruction}

CASE CONTEXT:
- Crop: ${crop}
- Diagnosed disease: ${disease}
- Initial severity: ${initialSeverity || "unknown"}
- Initial diagnosis summary: ${caseSummary || "n/a"}
- Days since case started: ${daysSinceStart ?? "?"}
- Days since last follow-up: ${daysSinceLastFollowup ?? "n/a"}
- Previous follow-ups (most recent first): ${JSON.stringify(previousFollowups || []).slice(0, 4000)}
- Farmer self-rating: ${farmerProgressRating || "n/a"}
- Farmer notes: ${farmerNotes || "n/a"}

Compare the new photo (if provided) against the original case context and prior follow-ups.
Return STRICT JSON only:
{
  "trend": "improving" | "stable" | "worsening" | "resolved",
  "currentSeverity": "none" | "mild" | "moderate" | "severe" | "critical",
  "recoveryPercent": 0-100,
  "visualChanges": ["short observation", "..."],
  "summary": "2-3 sentence plain-language progress summary the farmer can read",
  "nextActions": [
    { "action": "what to do", "timing": "when", "priority": "high|medium|low" }
  ],
  "nextFollowupInDays": 3,
  "concernFlags": ["any red flags or empty array"],
  "encouragement": "one short motivational line for the farmer"
}`,
    });

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content }],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI gateway error: ${res.status} ${t}`);
    }
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("disease-followup error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
