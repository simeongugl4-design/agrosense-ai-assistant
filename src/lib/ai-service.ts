import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface CropRecommendation {
  crop: string;
  yieldEstimate: string;
  profit: string;
  duration: string;
  suitability: number;
  waterNeeds: string;
  tips: string;
  sowingWindow: string;
  harvestTime: string;
}

export interface DiseaseAnalysis {
  disease: string;
  confidence: number;
  severity: string;
  symptoms: string[];
  treatment: {
    organic: string;
    chemical: string;
    immediate: string;
  };
  prevention: string;
  expertNeeded: boolean;
  expertReason: string;
  possibleAlternatives?: string[];
}

export interface WeatherData {
  location: string;
  coordinates: { latitude: number; longitude: number };
  current: {
    temp: number;
    humidity: number;
    windSpeed: number;
    feelsLike: number;
    uvIndex: number;
    rainfall: number;
    condition: string;
    weatherCode: number;
  };
  forecast: Array<{
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
  }>;
  farmingAlerts: Array<{
    type: "warning" | "info" | "success";
    title: string;
    message: string;
  }>;
  farmingTips: Array<{
    activity: string;
    recommendation: string;
    status: "urgent" | "pause" | "wait" | "good";
  }>;
}

export interface FertilizerPlan {
  nutrientLevels: Record<string, {
    current: number;
    optimal: number;
    status: string;
    action: string;
  }>;
  recommendations: Array<{
    nutrient: string;
    product: string;
    quantity: string;
    timing: string;
    method: string;
    cost: string;
    priority: string;
  }>;
  schedule: Array<{
    week: string;
    action: string;
    status: string;
  }>;
  totalCostPerHectare: number;
  expectedYieldBoost: string;
  organicAlternatives: Array<{
    name: string;
    benefit: string;
    application: string;
  }>;
  warnings: string[];
}

export interface IrrigationPlan {
  dailyWaterNeed: number;
  dailyWaterUnit: string;
  optimalRange: string;
  soilMoistureTarget: { min: number; max: number; current: number };
  stats: {
    todayUsage: { value: number; unit: string; changePercent: number };
    weeklySavings: { value: number; unit: string; costSaved: number };
    efficiency: { value: number; label: string };
  };
  schedule: Array<{
    day: string;
    time: string;
    duration: string;
    status: string;
    waterAmount: number;
    notes?: string;
  }>;
  weatherAlerts: Array<{
    title: string;
    message: string;
    type: string;
  }>;
  tips: string[];
  method: string;
}

// Streaming chat with AI assistant
export async function streamChat({
  messages,
  type = "general",
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  type?: "general" | "crop_recommendation" | "disease_detection";
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError?: (error: Error) => void;
}) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages, type }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to connect to AI");
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }

    onDone();
  } catch (error) {
    console.error("Stream chat error:", error);
    onError?.(error instanceof Error ? error : new Error("Unknown error"));
  }
}

// Get crop recommendations
export async function getCropRecommendations(params: {
  location: string;
  soilType: string;
  season: string;
  farmSize?: string;
}): Promise<{ recommendations: CropRecommendation[] }> {
  const { data, error } = await supabase.functions.invoke("crop-advisor", {
    body: params,
  });

  if (error) {
    console.error("Crop advisor error:", error);
    throw new Error(error.message || "Failed to get recommendations");
  }

  return data;
}

// Analyze crop disease
export async function analyzeCropDisease(params: {
  imageBase64?: string;
  cropType?: string;
  symptoms?: string;
}): Promise<DiseaseAnalysis> {
  const { data, error } = await supabase.functions.invoke("disease-detection", {
    body: params,
  });

  if (error) {
    console.error("Disease detection error:", error);
    throw new Error(error.message || "Failed to analyze disease");
  }

  return data;
}

// Get real weather data
export async function getWeatherData(location: string): Promise<WeatherData> {
  const { data, error } = await supabase.functions.invoke("weather-data", {
    body: { location },
  });

  if (error) {
    console.error("Weather data error:", error);
    throw new Error(error.message || "Failed to fetch weather data");
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

// Get AI fertilizer recommendations
export async function getFertilizerPlan(params: {
  cropType: string;
  growthStage: string;
  soilType?: string;
  fieldSize?: string;
  location?: string;
}): Promise<FertilizerPlan> {
  const { data, error } = await supabase.functions.invoke("fertilizer-advisor", {
    body: params,
  });

  if (error) {
    console.error("Fertilizer advisor error:", error);
    throw new Error(error.message || "Failed to get fertilizer plan");
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

// Get AI irrigation plan
export async function getIrrigationPlan(params: {
  cropType: string;
  growthStage: string;
  fieldSize?: string;
  soilType?: string;
  location?: string;
}): Promise<IrrigationPlan> {
  const { data, error } = await supabase.functions.invoke("irrigation-advisor", {
    body: params,
  });

  if (error) {
    console.error("Irrigation advisor error:", error);
    throw new Error(error.message || "Failed to get irrigation plan");
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

// Analyze soil from photo
export async function analyzeSoil(params: {
  imageBase64: string;
  location?: string;
  currentCrops?: string;
  language?: string;
}): Promise<any> {
  const { data, error } = await supabase.functions.invoke("soil-analysis", {
    body: params,
  });

  if (error) {
    console.error("Soil analysis error:", error);
    throw new Error(error.message || "Failed to analyze soil");
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}
