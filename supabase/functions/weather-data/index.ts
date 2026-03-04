import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const geocodingHeaders = {
  Accept: "application/json",
  "User-Agent": "AgroSenseAI/1.0 (Lovable Cloud)",
};

type ForecastDay = {
  day: string;
  date: string;
  high: number;
  low: number;
  rainChance: number;
  precipitation: number;
  windSpeed: number;
  uvIndex: number;
  condition: string;
  weatherCode: number;
};

type CurrentWeather = {
  temp: number;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  uvIndex: number;
  rainfall: number;
  condition: string;
  weatherCode: number;
};

type Insight = {
  type: "warning" | "info" | "success";
  title: string;
  message: string;
};

type Tip = {
  activity: string;
  recommendation: string;
  status: "urgent" | "pause" | "wait" | "good";
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  class?: string;
  type?: string;
  addresstype?: string;
  address?: {
    village?: string;
    town?: string;
    city?: string;
    municipality?: string;
    county?: string;
    state?: string;
    region?: string;
    province?: string;
    country?: string;
  };
};

const weatherCodeMap: Record<number, string> = {
  0: "Clear Sky",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing Rime Fog",
  51: "Light Drizzle",
  53: "Moderate Drizzle",
  55: "Dense Drizzle",
  56: "Light Freezing Drizzle",
  57: "Dense Freezing Drizzle",
  61: "Slight Rain",
  63: "Moderate Rain",
  65: "Heavy Rain",
  66: "Light Freezing Rain",
  67: "Heavy Freezing Rain",
  71: "Slight Snow",
  73: "Moderate Snow",
  75: "Heavy Snow",
  77: "Snow Grains",
  80: "Slight Rain Showers",
  81: "Moderate Rain Showers",
  82: "Violent Rain Showers",
  85: "Slight Snow Showers",
  86: "Heavy Snow Showers",
  95: "Thunderstorm",
  96: "Thunderstorm with Slight Hail",
  99: "Thunderstorm with Heavy Hail",
};

const uniqueParts = (parts: Array<string | undefined>) =>
  parts.filter((part): part is string => Boolean(part)).filter((part, index, values) => values.indexOf(part) === index);

const normalize = (value: string) =>
  value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const scoreTextMatch = (query: string, haystack: string) => {
  const queryTokens = normalize(query).split(/[\s,/-]+/).filter((token) => token.length > 1);
  const normalizedHaystack = normalize(haystack);
  return queryTokens.reduce((score, token) => score + (normalizedHaystack.includes(token) ? 3 : 0), 0);
};

const formatLocationName = (result: NominatimResult) => {
  const address = result.address || {};
  const primary = result.name || address.village || address.town || address.city || address.municipality || address.county || address.state || address.region || result.display_name.split(",")[0];
  const secondary = uniqueParts([
    address.county,
    address.state,
    address.region,
    address.province,
    address.country,
  ]).filter((part) => part !== primary);

  return [primary, ...secondary].join(", ");
};

const scoreNominatimResult = (query: string, result: NominatimResult) => {
  const address = result.address || {};
  const haystack = [
    result.display_name,
    result.name,
    address.village,
    address.town,
    address.city,
    address.municipality,
    address.county,
    address.state,
    address.region,
    address.province,
    address.country,
  ]
    .filter(Boolean)
    .join(" ");

  let score = scoreTextMatch(query, haystack);

  if (["state", "province", "region", "county", "city", "town", "village", "municipality"].includes(result.addresstype || "")) score += 12;
  if (result.class === "boundary" && result.type === "administrative") score += 10;
  if (result.class === "place") score += 6;

  return score;
};

const searchNominatim = async (query: string): Promise<NominatimResult[]> => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=12&q=${encodeURIComponent(query)}`,
    { headers: geocodingHeaders },
  );

  if (!response.ok) {
    throw new Error(`Nominatim search failed with status ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

const reverseNominatim = async (latitude: number, longitude: number): Promise<string | null> => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${latitude}&lon=${longitude}`,
    { headers: geocodingHeaders },
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  if (!data) return null;

  return formatLocationName({
    lat: String(latitude),
    lon: String(longitude),
    display_name: data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    name: data.name,
    addresstype: data.addresstype,
    class: data.class,
    type: data.type,
    address: data.address,
  });
};

const searchOpenMeteo = async (query: string) => {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=20&language=en`,
  );

  if (!response.ok) {
    throw new Error(`Open-Meteo geocoding failed with status ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data.results) ? data.results : [];
};

const resolveLocation = async (location: string) => {
  const coordsMatch = location.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (coordsMatch) {
    const latitude = parseFloat(coordsMatch[1]);
    const longitude = parseFloat(coordsMatch[2]);
    const locationName = await reverseNominatim(latitude, longitude);

    return {
      latitude,
      longitude,
      locationName: locationName || `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`,
    };
  }

  const nominatimResults = await searchNominatim(location).catch(() => []);
  if (nominatimResults.length > 0) {
    const bestResult = [...nominatimResults].sort((left, right) => scoreNominatimResult(location, right) - scoreNominatimResult(location, left))[0];

    return {
      latitude: parseFloat(bestResult.lat),
      longitude: parseFloat(bestResult.lon),
      locationName: formatLocationName(bestResult),
    };
  }

  const searchTerms = uniqueParts([location, ...location.split(",").map((part) => part.trim())]);
  for (const term of searchTerms) {
    if (!term) continue;

    const openMeteoResults = await searchOpenMeteo(term).catch(() => []);
    if (openMeteoResults.length === 0) continue;

    const bestResult = [...openMeteoResults].sort((left, right) => {
      const leftHaystack = `${left.name || ""} ${left.admin1 || ""} ${left.admin2 || ""} ${left.country || ""}`;
      const rightHaystack = `${right.name || ""} ${right.admin1 || ""} ${right.admin2 || ""} ${right.country || ""}`;
      return scoreTextMatch(location, rightHaystack) - scoreTextMatch(location, leftHaystack);
    })[0];

    return {
      latitude: bestResult.latitude,
      longitude: bestResult.longitude,
      locationName: uniqueParts([bestResult.name, bestResult.admin2, bestResult.admin1, bestResult.country]).join(", "),
    };
  }

  throw new Error(`Location "${location}" not found. Try a village, province, district, town, city, or country name.`);
};

const buildFallbackInsights = (current: CurrentWeather, forecast: ForecastDay[]) => {
  const alerts: Insight[] = [];
  const tips: Tip[] = [];
  const wetDays = forecast.filter((day) => day.rainChance >= 65 || day.precipitation >= 10);
  const hotDays = forecast.filter((day) => day.high >= 33);
  const windyDays = forecast.filter((day) => day.windSpeed >= 30);

  if (wetDays.length > 0) {
    alerts.push({
      type: "warning",
      title: "Heavy rain risk",
      message: `Rain is likely on ${wetDays.map((day) => day.day).join(", ")}. Clear drainage lines and delay fertilizer or spray applications before peak rainfall.`,
    });
    tips.push({
      activity: "Fertilizer",
      recommendation: "Pause fertilizer spreading before the heaviest rain days to avoid runoff and nutrient loss.",
      status: "pause",
    });
    tips.push({
      activity: "Pesticide Spray",
      recommendation: "Wait for a drier window before spraying so treatments are not washed off.",
      status: "wait",
    });
  }

  if (hotDays.length > 0 || current.temp >= 35) {
    alerts.push({
      type: "warning",
      title: "Heat stress window",
      message: "High temperatures can increase plant stress and evaporation. Water early morning and protect young plants with mulch where possible.",
    });
    tips.push({
      activity: "Irrigation",
      recommendation: "Shift irrigation to early morning or late evening and check soil moisture more frequently during hot afternoons.",
      status: "urgent",
    });
  }

  if (current.humidity >= 85) {
    alerts.push({
      type: "info",
      title: "Disease pressure rising",
      message: "High humidity can increase fungal disease risk. Scout leaves, stems, and fruits more often and improve airflow where possible.",
    });
  }

  if (windyDays.length > 0 || current.windSpeed >= 25) {
    alerts.push({
      type: "info",
      title: "Strong wind caution",
      message: "Strong winds may reduce spray efficiency and stress tall crops. Secure supports and avoid spraying during gusty periods.",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      type: "success",
      title: "Stable farming window",
      message: "Weather conditions look fairly stable. This is a good time for routine field scouting, weeding, and planned farm work.",
    });
  }

  if (tips.length === 0) {
    tips.push({
      activity: "Field scouting",
      recommendation: "Use the stable weather window to inspect crops for pests, nutrient stress, and irrigation needs.",
      status: "good",
    });
    tips.push({
      activity: "Harvesting",
      recommendation: "Harvest mature crops during the driest part of the day and keep produce shaded after harvest.",
      status: "good",
    });
  }

  return {
    alerts: alerts.slice(0, 4),
    tips: tips.slice(0, 5),
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { location } = await req.json();
    if (!location) {
      throw new Error("Location is required");
    }

    console.log("Weather request for location:", location);
    const { latitude, longitude, locationName } = await resolveLocation(location);
    console.log(`Resolved to: ${locationName} (${latitude}, ${longitude})`);

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max&timezone=auto&forecast_days=7`;
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();

    if (!weatherData.current || !weatherData.daily) {
      throw new Error("Failed to fetch weather data");
    }

    const current: CurrentWeather = {
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
    const forecast: ForecastDay[] = weatherData.daily.time.map((date: string, index: number) => {
      const parsedDate = new Date(date);
      const dayName = index === 0 ? "Today" : index === 1 ? "Tomorrow" : dayNames[parsedDate.getDay()];

      return {
        day: dayName,
        date,
        high: Math.round(weatherData.daily.temperature_2m_max[index]),
        low: Math.round(weatherData.daily.temperature_2m_min[index]),
        rainChance: weatherData.daily.precipitation_probability_max[index],
        precipitation: weatherData.daily.precipitation_sum[index],
        windSpeed: Math.round(weatherData.daily.wind_speed_10m_max[index]),
        uvIndex: weatherData.daily.uv_index_max[index],
        condition: weatherCodeMap[weatherData.daily.weather_code[index]] || "Unknown",
        weatherCode: weatherData.daily.weather_code[index],
      };
    });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let farmingAlerts: Insight[] = [];
    let farmingTips: Tip[] = [];

    if (LOVABLE_API_KEY) {
      try {
        const forecastSummary = forecast
          .map((day) => `${day.day}: ${day.condition}, ${day.high}°C/${day.low}°C, Rain ${day.rainChance}%, Wind ${day.windSpeed}km/h, Precip ${day.precipitation}mm`)
          .join("\n");

        const aiPrompt = `You are generating live farming weather insights for ${locationName}.\n\nCurrent conditions: ${current.condition}, ${current.temp}°C, humidity ${current.humidity}%, wind ${current.windSpeed}km/h, UV ${current.uvIndex}, rainfall ${current.rainfall}mm.\n\n7-day forecast:\n${forecastSummary}\n\nReturn ONLY valid JSON in this shape:\n{\n  "alerts": [{"type":"warning|info|success","title":"string","message":"string"}],\n  "tips": [{"activity":"string","recommendation":"string","status":"urgent|pause|wait|good"}]\n}\n\nRules:\n- Use actionable advice for farmers.\n- Mention timing or weather trigger when helpful.\n- Keep alerts to 3-4 and tips to 4-5.`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          const jsonMatch = content?.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            farmingAlerts = Array.isArray(parsed.alerts) ? parsed.alerts : [];
            farmingTips = Array.isArray(parsed.tips) ? parsed.tips : [];
          }
        }
      } catch (error) {
        console.error("AI weather insights error (non-critical):", error);
      }
    }

    if (farmingAlerts.length === 0 || farmingTips.length === 0) {
      const fallbackInsights = buildFallbackInsights(current, forecast);
      if (farmingAlerts.length === 0) farmingAlerts = fallbackInsights.alerts;
      if (farmingTips.length === 0) farmingTips = fallbackInsights.tips;
    }

    return new Response(JSON.stringify({
      location: locationName,
      coordinates: { latitude, longitude },
      current,
      forecast,
      farmingAlerts,
      farmingTips,
    }), {
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
