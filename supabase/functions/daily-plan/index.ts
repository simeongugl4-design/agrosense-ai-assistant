import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PlanInput {
  language?: string;
  country?: string;
  location?: string;
  primaryCrop?: string;
  soilType?: string;
  farmSize?: string;
  weather?: {
    temp?: number;
    condition?: string;
    humidity?: number;
    rainChanceToday?: number;
    rainChanceTomorrow?: number;
  };
  upcomingTasks?: Array<{ title: string; date: string; priority: string; crop?: string | null }>;
}

const TOOL = {
  type: "function",
  function: {
    name: "build_daily_plan",
    description: "Personalized daily action plan for the farmer.",
    parameters: {
      type: "object",
      properties: {
        greeting: { type: "string", description: "Short, warm greeting in user's language." },
        summary: { type: "string", description: "1-2 sentence summary of today's farming priorities." },
        actions: {
          type: "array",
          minItems: 3,
          maxItems: 6,
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              detail: { type: "string", description: "Practical, step-by-step instructions." },
              priority: { type: "string", enum: ["high", "medium", "low"] },
              category: {
                type: "string",
                enum: ["irrigation", "pest", "fertilizer", "harvest", "planting", "soil", "market", "weather", "general"],
              },
              timing: { type: "string", description: "When to do it today (e.g. 'before 10am')." },
            },
            required: ["title", "detail", "priority", "category", "timing"],
            additionalProperties: false,
          },
        },
        alerts: {
          type: "array",
          maxItems: 3,
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["warning", "info", "success"] },
              title: { type: "string" },
              message: { type: "string" },
            },
            required: ["type", "title", "message"],
            additionalProperties: false,
          },
        },
      },
      required: ["greeting", "summary", "actions", "alerts"],
      additionalProperties: false,
    },
  },
} as const;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const input = (await req.json()) as PlanInput;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const language = input.language?.trim() || "English";
    const country = input.country?.trim() || "";

    const systemPrompt = `You are AgroSense AI's daily planner for smallholder farmers.
Generate a tight, prioritized plan for TODAY based on the farmer's profile, weather, and pending tasks.
Rules:
- Respond ONLY by calling the build_daily_plan tool.
- Write all user-facing strings in ${language}.
- Tailor advice to ${country || "the farmer's region"}.
- Be specific about timing (morning/afternoon), quantity, and safety.
- Prioritize weather-sensitive actions (rain, heat, wind) and overdue tasks.
- Keep each action actionable in <30 minutes when possible.`;

    const userContent = JSON.stringify(input, null, 2);

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
          { role: "user", content: userContent },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "build_daily_plan" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("daily-plan AI error", response.status, text);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments;
    if (!args) {
      return new Response(JSON.stringify({ error: "No plan generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const plan = JSON.parse(args);
    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("daily-plan error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
