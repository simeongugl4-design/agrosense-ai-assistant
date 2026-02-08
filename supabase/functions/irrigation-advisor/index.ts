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
    const { cropType, growthStage, fieldSize, soilType, location } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Irrigation advisor request:", { cropType, growthStage, fieldSize, soilType, location });

    // Fetch weather for the location if provided
    let weatherInfo = "No weather data available";
    if (location) {
      try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();
        
        if (geoData.results && geoData.results.length > 0) {
          const { latitude, longitude } = geoData.results[0];
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation&daily=precipitation_sum,precipitation_probability_max&timezone=auto&forecast_days=7`;
          const weatherRes = await fetch(weatherUrl);
          const weatherData = await weatherRes.json();
          
          if (weatherData.current) {
            const dailyRain = weatherData.daily.precipitation_sum.map((p: number, i: number) => 
              `Day ${i+1}: ${p}mm (${weatherData.daily.precipitation_probability_max[i]}% chance)`
            ).join(", ");
            weatherInfo = `Current temp: ${weatherData.current.temperature_2m}°C, Humidity: ${weatherData.current.relative_humidity_2m}%, Current rain: ${weatherData.current.precipitation}mm. 7-day rain forecast: ${dailyRain}`;
          }
        }
      } catch (e) {
        console.error("Weather fetch error (non-critical):", e);
      }
    }

    const prompt = `As an expert irrigation scientist, create a smart irrigation plan for:

Crop: ${cropType}
Growth Stage: ${growthStage}
Field Size: ${fieldSize || '1'} hectares
Soil Type: ${soilType || 'Not specified'}
Location: ${location || 'India'}

Current Weather Context: ${weatherInfo}

Provide the response in this exact JSON format:
{
  "dailyWaterNeed": 400,
  "dailyWaterUnit": "liters/hectare",
  "optimalRange": "350-450 liters/hectare/day",
  "soilMoistureTarget": {"min": 60, "max": 75, "current": 68},
  "stats": {
    "todayUsage": {"value": 1240, "unit": "L", "changePercent": -8},
    "weeklySavings": {"value": 2450, "unit": "L", "costSaved": 180},
    "efficiency": {"value": 85, "label": "Good"}
  },
  "schedule": [
    {
      "day": "Today",
      "time": "6:00 AM",
      "duration": "45 min",
      "status": "completed|upcoming|scheduled|rain",
      "waterAmount": 120,
      "notes": "Optional note"
    }
  ],
  "weatherAlerts": [
    {"title": "Alert title", "message": "Alert details", "type": "info|warning|success"}
  ],
  "tips": [
    "Practical irrigation tip 1",
    "Practical irrigation tip 2"
  ],
  "method": "Recommended irrigation method (drip/flood/sprinkler) with reasoning"
}

Include 5-7 schedule entries covering the next 5 days. Factor in the weather forecast - skip irrigation on rainy days. Use Indian farming context. Return ONLY valid JSON.`;

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
      throw new Error("Failed to generate irrigation plan. Please try again.");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Irrigation advisor error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
