import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sprout, TrendingUp, DollarSign, Calendar, Sparkles, Droplets, Loader2, Clock } from "lucide-react";
import { getCropRecommendations } from "@/lib/ai-service";
import { toast } from "@/hooks/use-toast";

const soilTypes = [
  "Clay",
  "Sandy",
  "Loamy",
  "Silty",
  "Peaty",
  "Chalky",
  "Black Soil",
  "Red Soil",
  "Alluvial Soil",
];

const seasons = ["Kharif (Monsoon)", "Rabi (Winter)", "Zaid (Summer)"];

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

export default function CropAdvisor() {
  const [location, setLocation] = useState("");
  const [soilType, setSoilType] = useState("");
  const [season, setSeason] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);

  const handleGetRecommendations = async () => {
    if (!location || !soilType || !season) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in location, soil type, and season.",
      });
      return;
    }

    setIsLoading(true);
    setRecommendations([]);

    try {
      const result = await getCropRecommendations({
        location,
        soilType,
        season,
        farmSize: farmSize || undefined,
      });
      
      setRecommendations(result.recommendations || []);
    } catch (error) {
      console.error("Recommendation error:", error);
      toast({
        variant: "destructive",
        title: "Failed to Get Recommendations",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getWaterColor = (needs: string) => {
    switch (needs?.toLowerCase()) {
      case "high":
        return "text-accent";
      case "medium":
        return "text-warning";
      case "low":
        return "text-success";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header 
          title="Crop Advisor" 
          subtitle="Get AI-powered crop recommendations based on your farm conditions" 
        />
        
        <main className="p-6">
          {/* Input Form */}
          <div className="bg-card rounded-xl border border-border p-6 mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-secondary" />
              Tell us about your farm
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="location">Location / Region *</Label>
                <Input
                  id="location"
                  placeholder="e.g., Punjab, Maharashtra"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="soil">Soil Type *</Label>
                <Select value={soilType} onValueChange={setSoilType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select soil type" />
                  </SelectTrigger>
                  <SelectContent>
                    {soilTypes.map((soil) => (
                      <SelectItem key={soil} value={soil.toLowerCase()}>
                        {soil}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="season">Planting Season *</Label>
                <Select value={season} onValueChange={setSeason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select season" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons.map((s) => (
                      <SelectItem key={s} value={s.toLowerCase()}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="farmSize">Farm Size (optional)</Label>
                <Input
                  id="farmSize"
                  placeholder="e.g., 5 hectares"
                  value={farmSize}
                  onChange={(e) => setFarmSize(e.target.value)}
                />
              </div>
            </div>
            <Button 
              className="mt-6" 
              size="lg"
              onClick={handleGetRecommendations}
              disabled={isLoading || !location || !soilType || !season}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Getting AI Recommendations...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get AI Recommendations
                </>
              )}
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-foreground font-medium">Analyzing your farm conditions...</p>
              <p className="text-sm text-muted-foreground">Our AI is finding the best crops for you</p>
            </div>
          )}

          {/* Results */}
          {!isLoading && recommendations.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Sprout className="w-5 h-5 text-success" />
                AI-Recommended Crops for Your Farm
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendations.map((rec, index) => (
                  <div
                    key={rec.crop}
                    className="bg-card rounded-xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                          <Sprout className="w-6 h-6 text-success" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{rec.crop}</h4>
                          <span className="text-sm text-success font-medium">
                            {rec.suitability}% match
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Yield:</span>
                        <span className="font-medium text-foreground">{rec.yieldEstimate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Profit:</span>
                        <span className="font-medium text-success">{rec.profit}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium text-foreground">{rec.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Droplets className={`w-4 h-4 ${getWaterColor(rec.waterNeeds)}`} />
                        <span className="text-muted-foreground">Water:</span>
                        <span className={`font-medium ${getWaterColor(rec.waterNeeds)}`}>{rec.waterNeeds}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Sow:</span>
                        <span className="font-medium text-foreground">{rec.sowingWindow}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground leading-relaxed">{rec.tips}</p>
                    </div>

                    <Button variant="outline" className="w-full mt-4">
                      View Full Plan
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && recommendations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Sprout className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                Enter your farm details above to get personalized crop recommendations
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
