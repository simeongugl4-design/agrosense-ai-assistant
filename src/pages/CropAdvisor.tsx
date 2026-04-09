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
import { Sprout, TrendingUp, DollarSign, Calendar, Sparkles, Droplets, Loader2, Clock, Lightbulb, ArrowRight } from "lucide-react";
import { getCropRecommendations } from "@/lib/ai-service";
import { toast } from "@/hooks/use-toast";
import { useDashboardTranslations } from "@/hooks/useDashboardTranslations";
import { useNavigate } from "react-router-dom";

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
  const { copy, format } = useDashboardTranslations();
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [soilType, setSoilType] = useState("");
  const [season, setSeason] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<CropRecommendation | null>(null);

  const soilTypes = [
    { value: "clay", label: copy.common.soilTypes.clay },
    { value: "sandy", label: copy.common.soilTypes.sandy },
    { value: "loamy", label: copy.common.soilTypes.loamy },
    { value: "silty", label: copy.common.soilTypes.silty },
    { value: "peaty", label: copy.common.soilTypes.peaty },
    { value: "chalky", label: copy.common.soilTypes.chalky },
    { value: "black soil", label: copy.common.soilTypes.blackSoil },
    { value: "red soil", label: copy.common.soilTypes.redSoil },
    { value: "alluvial soil", label: copy.common.soilTypes.alluvialSoil },
  ];

  const seasons = [
    { value: "kharif (monsoon)", label: copy.common.seasons.kharif },
    { value: "rabi (winter)", label: copy.common.seasons.rabi },
    { value: "zaid (summer)", label: copy.common.seasons.zaid },
  ];

  const handleGetRecommendations = async () => {
    if (!location || !soilType || !season) {
      toast({
        variant: "destructive",
        title: copy.cropAdvisor.errors.missingTitle,
        description: copy.cropAdvisor.errors.missingDescription,
      });
      return;
    }

    setIsLoading(true);
    setRecommendations([]);
    setSelectedCrop(null);

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
        title: copy.cropAdvisor.errors.failedTitle,
        description: error instanceof Error ? error.message : copy.cropAdvisor.errors.tryAgain,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getWaterColor = (needs: string) => {
    switch (needs?.toLowerCase()) {
      case "high": return "text-accent";
      case "medium": return "text-warning";
      case "low": return "text-success";
      default: return "text-muted-foreground";
    }
  };

  const getSuitabilityColor = (score: number) => {
    if (score >= 80) return "bg-success text-success-foreground";
    if (score >= 60) return "bg-warning text-warning-foreground";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header title={copy.cropAdvisor.title} subtitle={copy.cropAdvisor.subtitle} />

        <main className="p-6">
          <div className="bg-card rounded-xl border border-border p-6 mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-secondary" />
              {copy.cropAdvisor.cardTitle}
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="location">{copy.cropAdvisor.labels.location}</Label>
                <Input id="location" placeholder={copy.cropAdvisor.placeholders.location} value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="soil">{copy.cropAdvisor.labels.soilType}</Label>
                <Select value={soilType} onValueChange={setSoilType}>
                  <SelectTrigger><SelectValue placeholder={copy.cropAdvisor.placeholders.soilType} /></SelectTrigger>
                  <SelectContent>{soilTypes.map((soil) => <SelectItem key={soil.value} value={soil.value}>{soil.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="season">{copy.cropAdvisor.labels.season}</Label>
                <Select value={season} onValueChange={setSeason}>
                  <SelectTrigger><SelectValue placeholder={copy.cropAdvisor.placeholders.season} /></SelectTrigger>
                  <SelectContent>{seasons.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="farmSize">{copy.cropAdvisor.labels.farmSize}</Label>
                <Input id="farmSize" placeholder={copy.cropAdvisor.placeholders.farmSize} value={farmSize} onChange={(e) => setFarmSize(e.target.value)} />
              </div>
            </div>
            <Button className="mt-6" size="lg" onClick={handleGetRecommendations} disabled={isLoading || !location || !soilType || !season}>
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{copy.cropAdvisor.buttons.loading}</> : <><Sparkles className="w-4 h-4 mr-2" />{copy.cropAdvisor.buttons.submit}</>}
            </Button>
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-foreground font-medium">{copy.cropAdvisor.loading.title}</p>
              <p className="text-sm text-muted-foreground">{copy.cropAdvisor.loading.subtitle}</p>
            </div>
          )}

          {!isLoading && recommendations.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Sprout className="w-5 h-5 text-success" />
                {copy.cropAdvisor.resultsTitle}
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendations.map((rec, index) => (
                  <div
                    key={rec.crop}
                    className={`bg-card rounded-xl border p-6 hover:shadow-lg transition-all animate-fade-in cursor-pointer ${selectedCrop?.crop === rec.crop ? "border-primary shadow-lg" : "border-border hover:border-primary/30"}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => setSelectedCrop(selectedCrop?.crop === rec.crop ? null : rec)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                          <Sprout className="w-6 h-6 text-success" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{rec.crop}</h4>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getSuitabilityColor(rec.suitability)}`}>
                            {format(copy.cropAdvisor.suitabilityMatch, { value: rec.suitability })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{copy.cropAdvisor.labels.yield}</span>
                        <span className="font-medium text-foreground">{rec.yieldEstimate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{copy.cropAdvisor.labels.profit}</span>
                        <span className="font-medium text-success">{rec.profit}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{copy.cropAdvisor.labels.duration}</span>
                        <span className="font-medium text-foreground">{rec.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Droplets className={`w-4 h-4 ${getWaterColor(rec.waterNeeds)}`} />
                        <span className="text-muted-foreground">{copy.cropAdvisor.labels.water}</span>
                        <span className={`font-medium ${getWaterColor(rec.waterNeeds)}`}>{rec.waterNeeds}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{copy.cropAdvisor.labels.sow}</span>
                        <span className="font-medium text-foreground">{rec.sowingWindow}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground leading-relaxed">{rec.tips}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Follow-Up Action Suggestions */}
              {selectedCrop && (
                <div className="bg-card rounded-xl border border-primary/30 p-6 animate-fade-in">
                  <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-secondary" />
                    Next Steps for {selectedCrop.crop}
                  </h4>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <button onClick={() => navigate("/dashboard/fertilizer")} className="p-4 rounded-xl bg-warning/5 border border-warning/20 hover:border-warning/40 transition-all text-left group">
                      <p className="text-sm font-medium text-foreground flex items-center gap-2">Get Fertilizer Plan <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></p>
                      <p className="text-xs text-muted-foreground mt-1">AI-optimized nutrients for {selectedCrop.crop}</p>
                    </button>
                    <button onClick={() => navigate("/dashboard/irrigation")} className="p-4 rounded-xl bg-accent/5 border border-accent/20 hover:border-accent/40 transition-all text-left group">
                      <p className="text-sm font-medium text-foreground flex items-center gap-2">Plan Irrigation <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></p>
                      <p className="text-xs text-muted-foreground mt-1">Water: {selectedCrop.waterNeeds} needs</p>
                    </button>
                    <button onClick={() => navigate("/dashboard/disease")} className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 hover:border-destructive/40 transition-all text-left group">
                      <p className="text-sm font-medium text-foreground flex items-center gap-2">Disease Scanner <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></p>
                      <p className="text-xs text-muted-foreground mt-1">Protect your {selectedCrop.crop} crop</p>
                    </button>
                    <button onClick={() => navigate("/dashboard/calendar")} className="p-4 rounded-xl bg-primary/5 border border-primary/20 hover:border-primary/40 transition-all text-left group">
                      <p className="text-sm font-medium text-foreground flex items-center gap-2">Schedule Sowing <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></p>
                      <p className="text-xs text-muted-foreground mt-1">Best window: {selectedCrop.sowingWindow}</p>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isLoading && recommendations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Sprout className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">{copy.cropAdvisor.empty}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
