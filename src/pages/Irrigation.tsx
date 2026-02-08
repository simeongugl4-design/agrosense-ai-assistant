import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { 
  Droplets, 
  Calendar, 
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Waves,
  Cloud,
  Loader2,
  Sparkles,
  Lightbulb,
} from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { getIrrigationPlan } from "@/lib/ai-service";
import type { IrrigationPlan } from "@/lib/ai-service";
import { toast } from "@/hooks/use-toast";

const cropOptions = ["Rice", "Wheat", "Maize", "Cotton", "Sugarcane", "Soybean", "Potato", "Tomato", "Onion", "Groundnut"];
const stageOptions = ["Seedling", "Vegetative", "Flowering", "Fruiting/Grain filling", "Maturity"];

export default function Irrigation() {
  const [cropType, setCropType] = useState("");
  const [growthStage, setGrowthStage] = useState("");
  const [fieldSize, setFieldSize] = useState("5");
  const [soilType, setSoilType] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<IrrigationPlan | null>(null);

  const handleGetPlan = async () => {
    if (!cropType || !growthStage) {
      toast({ variant: "destructive", title: "Please select crop type and growth stage" });
      return;
    }
    setIsLoading(true);
    try {
      const data = await getIrrigationPlan({
        cropType, growthStage, fieldSize, soilType, location,
      });
      setPlan(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to get irrigation plan",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header 
          title="Smart Irrigation" 
          subtitle="AI-optimized water management for your crops" 
        />
        
        <main className="p-4 lg:p-6">
          {/* Input Form */}
          <div className="bg-card rounded-xl border border-border p-5 lg:p-6 mb-6 lg:mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Generate Your Irrigation Plan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Crop Type *</Label>
                <Select value={cropType} onValueChange={setCropType}>
                  <SelectTrigger><SelectValue placeholder="Select crop" /></SelectTrigger>
                  <SelectContent>
                    {cropOptions.map(c => <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Growth Stage *</Label>
                <Select value={growthStage} onValueChange={setGrowthStage}>
                  <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                  <SelectContent>
                    {stageOptions.map(s => <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Field Size (ha)</Label>
                <Input type="number" value={fieldSize} onChange={(e) => setFieldSize(e.target.value)} placeholder="5" />
              </div>
              <div className="space-y-2">
                <Label>Soil Type</Label>
                <Select value={soilType} onValueChange={setSoilType}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    {["Clay", "Sandy", "Loamy", "Silty", "Black Soil", "Red Soil", "Alluvial"].map(s => 
                      <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Punjab" />
              </div>
            </div>
            <Button className="mt-5" size="lg" onClick={handleGetPlan} disabled={isLoading || !cropType || !growthStage}>
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating Plan...</> : <><Sparkles className="w-4 h-4 mr-2" />Get AI Irrigation Plan</>}
            </Button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-foreground font-medium">Analyzing weather & crop data...</p>
              <p className="text-sm text-muted-foreground">Creating your personalized irrigation schedule</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !plan && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Droplets className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Select your crop and growth stage to get an AI-powered irrigation schedule</p>
            </div>
          )}

          {/* Results */}
          {!isLoading && plan && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-card rounded-xl border border-border p-4 lg:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs lg:text-sm text-muted-foreground">Daily Need</p>
                      <p className="text-xl lg:text-2xl font-bold text-foreground">{plan.dailyWaterNeed} {plan.dailyWaterUnit?.split("/")[0] || "L"}</p>
                      <p className="text-xs text-muted-foreground">per hectare</p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Droplets className="w-5 h-5 lg:w-6 lg:h-6 text-accent" />
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 lg:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs lg:text-sm text-muted-foreground">Weekly Savings</p>
                      <p className="text-xl lg:text-2xl font-bold text-success">{plan.stats?.weeklySavings?.value || 0} {plan.stats?.weeklySavings?.unit || "L"}</p>
                      <p className="text-xs text-muted-foreground">₹{plan.stats?.weeklySavings?.costSaved || 0} saved</p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-success/10 flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 lg:w-6 lg:h-6 text-success" />
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 lg:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs lg:text-sm text-muted-foreground">Soil Moisture</p>
                      <p className="text-xl lg:text-2xl font-bold text-foreground">{plan.soilMoistureTarget?.current || 65}%</p>
                      <p className="text-xs text-success">Target: {plan.soilMoistureTarget?.min}-{plan.soilMoistureTarget?.max}%</p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Waves className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 lg:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs lg:text-sm text-muted-foreground">Efficiency</p>
                      <p className="text-xl lg:text-2xl font-bold text-foreground">{plan.stats?.efficiency?.value || 80}%</p>
                      <p className="text-xs text-muted-foreground">{plan.stats?.efficiency?.label || "Good"}</p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-warning" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Moisture + Method */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Waves className="w-5 h-5 text-accent" />
                      Soil Moisture
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current level</span>
                        <span className="font-medium text-foreground">{plan.soilMoistureTarget?.current || 65}%</span>
                      </div>
                      <Progress value={plan.soilMoistureTarget?.current || 65} className="h-3" />
                      <p className="text-xs text-muted-foreground">
                        Optimal: {plan.soilMoistureTarget?.min || 60}-{plan.soilMoistureTarget?.max || 75}% for {cropType}
                      </p>
                    </div>
                  </div>
                  
                  {plan.method && (
                    <div className="bg-card rounded-xl border border-border p-5">
                      <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-secondary" />
                        Recommended Method
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{plan.method}</p>
                    </div>
                  )}

                  {plan.tips && plan.tips.length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-5">
                      <h3 className="text-base font-semibold text-foreground mb-3">💡 Pro Tips</h3>
                      <ul className="space-y-2">
                        {plan.tips.map((tip, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-success mt-0.5">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Schedule */}
                <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
                  <h3 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Smart Irrigation Schedule
                  </h3>
                  <div className="space-y-3">
                    {plan.schedule?.map((item, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 lg:p-4 rounded-xl border ${
                          item.status === "completed"
                            ? "bg-success/5 border-success/30"
                            : item.status === "upcoming"
                            ? "bg-warning/5 border-warning/30"
                            : item.status === "rain"
                            ? "bg-accent/5 border-accent/30"
                            : "bg-muted/50 border-border"
                        }`}
                      >
                        <div className="flex items-center gap-3 lg:gap-4">
                          {item.status === "completed" ? (
                            <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                          ) : item.status === "upcoming" ? (
                            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
                          ) : item.status === "rain" ? (
                            <Cloud className="w-5 h-5 text-accent flex-shrink-0" />
                          ) : (
                            <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-foreground text-sm">{item.day}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.status === "rain" ? (item.notes || "Rain expected - skip irrigation") : `${item.time} • ${item.duration}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {item.status !== "rain" ? (
                            <>
                              <p className="font-medium text-foreground text-sm">{item.waterAmount} L</p>
                              <p className="text-xs text-muted-foreground">water usage</p>
                            </>
                          ) : (
                            <span className="text-xs text-success font-medium">Saving water!</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Weather Alerts */}
                  {plan.weatherAlerts && plan.weatherAlerts.length > 0 && (
                    <div className="mt-5 space-y-3">
                      {plan.weatherAlerts.map((alert, i) => (
                        <div key={i} className="p-3 lg:p-4 rounded-xl bg-accent/10 border border-accent/30">
                          <h4 className="font-medium text-foreground text-sm">{alert.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
