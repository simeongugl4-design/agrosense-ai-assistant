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
    const { location } = await req.json();
    
    if (!location) {
      throw new Error("Location is required");
    }

    console.log("Weather request for location:", location);

    let latitude: number, longitude: number, locationName: string;

    // Check if location is coordinates (lat, lon)
    const coordsMatch = location.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
    
    if (coordsMatch) {
      latitude = parseFloat(coordsMatch[1]);
      longitude = parseFloat(coordsMatch[2]);
      // Reverse geocode to get name
      const reverseUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${latitude.toFixed(1)}&count=1`;
      try {
        const rRes = await fetch(reverseUrl);
        const rData = await rRes.json();
        locationName = rData.results?.[0] ? `${rData.results[0].name}, ${rData.results[0].country}` : `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
      } catch {
        locationName = `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
      }
    } else {
      // Geocode the location name - search broadly to find villages/towns
      const searchTerms = location.split(",").map((p: string) => p.trim());
      const primarySearch = searchTerms[0];
      
      // Search with larger count for better matching of small places
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(primarySearch)}&count=10&language=en`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error(`Location "${location}" not found. Try searching for a nearby town or city.`);
      }

      // Try to match region/country if provided
      let bestResult = geoData.results[0];
      if (searchTerms.length > 1) {
        const regionTerms = searchTerms.slice(1).map((t: string) => t.toLowerCase());
        const regionMatch = geoData.results.find((r: any) => 
          regionTerms.some((term: string) =>
            r.admin1?.toLowerCase().includes(term) || 
            r.admin2?.toLowerCase().includes(term) || 
            r.country?.toLowerCase().includes(term) ||
            r.country_code?.toLowerCase() === term
          )
        );
        if (regionMatch) bestResult = regionMatch;
      }

      latitude = bestResult.latitude;
      longitude = bestResult.longitude;
      locationName = `${bestResult.name}${bestResult.admin2 ? `, ${bestResult.admin2}` : ''}${bestResult.admin1 ? `, ${bestResult.admin1}` : ''}, ${bestResult.country}`;
    }

    console.log(`Resolved to: ${locationName} (${latitude}, ${longitude})`);

    // Fetch current weather + 7-day forecast from Open-Meteo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max&timezone=auto&forecast_days=7`;
    
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    if (!weatherData.current) {
      throw new Error("Failed to fetch weather data");
    }

    const weatherCodeMap: Record<number, string> = {
      0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
      45: "Foggy", 48: "Depositing Rime Fog",
      51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
      56: "Light Freezing Drizzle", 57: "Dense Freezing Drizzle",
      61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
      66: "Light Freezing Rain", 67: "Heavy Freezing Rain",
      71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow",
      77: "Snow Grains",
      80: "Slight Rain Showers", 81: "Moderate Rain Showers", 82: "Violent Rain Showers",
      85: "Slight Snow Showers", 86: "Heavy Snow Showers",
      95: "Thunderstorm", 96: "Thunderstorm with Slight Hail", 99: "Thunderstorm with Heavy Hail",
    };

    const current = {
      temp: Math.round(weatherData.current.temperature_2m),
      humidity: weatherData.current.relative_humidity_2m,
      windSpeed: Math.round(weatherData.current.wind_speed_10m),
      feelsLike: Math.round(weatherData.current.apparent_temperature),
      uvIndex: weatherData.current.uv_index,
      rainfall: weatherData.current.precipitation,
      condition: weatherCodeMap[weatherData.current.weather_code] || "Unknown",
      weatherCode: weatherData.current.weather_code,
    };

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const forecast = weatherData.daily.time.map((date: string, i: number) => {
      const d = new Date(date);
      const dayName = i === 0 ? "Today" : i === 1 ? "Tomorrow" : dayNames[d.getDay()];
      return {
        day: dayName,
        date,
        high: Math.round(weatherData.daily.temperature_2m_max[i]),
        low: Math.round(weatherData.daily.temperature_2m_min[i]),
        rainChance: weatherData.daily.precipitation_probability_max[i],
        precipitation: weatherData.daily.precipitation_sum[i],
        windSpeed: Math.round(weatherData.daily.wind_speed_10m_max[i]),
        uvIndex: weatherData.daily.uv_index_max[i],
        condition: weatherCodeMap[weatherData.daily.weather_code[i]] || "Unknown",
        weatherCode: weatherData.daily.weather_code[i],
      };
    });

    // Generate AI farming alerts
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let farmingAlerts: any[] = [];
    let farmingTips: any[] = [];

    if (LOVABLE_API_KEY) {
      try {
        const forecastSummary = forecast.map((f: any) => `${f.day}: ${f.condition}, ${f.high}°C/${f.low}°C, Rain: ${f.rainChance}%, Precip: ${f.precipitation}mm`).join("\n");
        
        const aiPrompt = `Based on this 7-day weather forecast for ${locationName}:

Current: ${current.condition}, ${current.temp}°C, Humidity: ${current.humidity}%, Wind: ${current.windSpeed}km/h, UV: ${current.uvIndex}

Forecast:
${forecastSummary}

Provide farming recommendations in this JSON format:
{
  "alerts": [
    {"type": "warning|info|success", "title": "Alert Title", "message": "Detailed farming advice based on weather"}
  ],
  "tips": [
    {"activity": "Irrigation|Pesticide Spray|Fertilizer|Harvesting|Sowing", "recommendation": "What to do", "status": "urgent|pause|wait|good"}
  ]
}

Include 3-4 alerts and 4-5 tips. Be specific about timing and actions. Return ONLY valid JSON.`;

        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [{ role: "user", content: aiPrompt }],
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const content = aiData.choices?.[0]?.message?.content;
          const jsonMatch = content?.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            farmingAlerts = parsed.alerts || [];
            farmingTips = parsed.tips || [];
          }
        }
      } catch (aiErr) {
        console.error("AI alerts error (non-critical):", aiErr);
      }
    }

    const result = {
      location: locationName,
      coordinates: { latitude, longitude },
      current,
      forecast,
      farmingAlerts,
      farmingTips,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Weather data error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});