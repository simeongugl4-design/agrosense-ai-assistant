import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CropRecommendation {
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

interface DiseaseAnalysis {
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
          // Incomplete JSON, put back and wait
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

// Analyze crop disease from image or symptoms
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
