import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { 
  FlaskConical, 
  Leaf, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  Sprout,
  Loader2,
  Sparkles,
  AlertTriangle,
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
import { getFertilizerPlan } from "@/lib/ai-service";
import type { FertilizerPlan } from "@/lib/ai-service";
import { toast } from "@/hooks/use-toast";

const cropOptions = ["Rice", "Wheat", "Maize", "Cotton", "Sugarcane", "Soybean", "Potato", "Tomato", "Onion", "Groundnut", "Mustard"];
const stageOptions = ["Seedling", "Vegetative", "Flowering", "Fruiting/Grain filling", "Maturity"];
const soilOptions = ["Clay", "Sandy", "Loamy", "Silty", "Peaty", "Black Soil", "Red Soil", "Alluvial Soil"];

export default function Fertilizer() {
  const [cropType, setCropType] = useState("");
  const [growthStage, setGrowthStage] = useState("");
  const [soilType, setSoilType] = useState("");
  const [fieldSize, setFieldSize] = useState("5");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<FertilizerPlan | null>(null);

  const handleGetPlan = async () => {
    if (!cropType || !growthStage) {
      toast({ variant: "destructive", title: "Please select crop type and growth stage" });
      return;
    }
    setIsLoading(true);
    try {
      const data = await getFertilizerPlan({ cropType, growthStage, soilType, fieldSize, location });
      setPlan(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to get fertilizer plan",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalCost = plan?.totalCostPerHectare ? plan.totalCostPerHectare * parseFloat(fieldSize || "1") : 0;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header 
          title="Fertilizer Planner" 
          subtitle="AI-optimized nutrient management for maximum yield" 
        />
        
        <main className="p-4 lg:p-6">
          {/* Input Form */}
          <div className="bg-card rounded-xl border border-border p-5 lg:p-6 mb-6 lg:mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-secondary" />
              Generate AI Fertilizer Plan
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
                <Label>Soil Type</Label>
                <Select value={soilType} onValueChange={setSoilType}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    {soilOptions.map(s => <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Field Size (ha)</Label>
                <Input type="number" value={fieldSize} onChange={(e) => setFieldSize(e.target.value)} placeholder="5" />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Maharashtra" />
              </div>
            </div>
            <Button className="mt-5" size="lg" onClick={handleGetPlan} disabled={isLoading || !cropType || !growthStage}>
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating Plan...</> : <><Sparkles className="w-4 h-4 mr-2" />Get AI Fertilizer Plan</>}
            </Button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-foreground font-medium">Analyzing soil & crop data...</p>
              <p className="text-sm text-muted-foreground">Creating your personalized fertilizer plan</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !plan && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FlaskConical className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Select your crop and growth stage to get an AI-powered fertilizer plan</p>
            </div>
          )}

          {/* Results */}
          {!isLoading && plan && (
            <>
              {/* Nutrient Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {plan.nutrientLevels && Object.entries(plan.nutrientLevels).map(([nutrient, data]) => (
                  <div key={nutrient} className="bg-card rounded-xl border border-border p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground capitalize">{nutrient}</p>
                        <p className="text-2xl font-bold text-foreground">{data.current}%</p>
                      </div>
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        data.status === "good" ? "bg-success/10" : data.status === "excess" ? "bg-destructive/10" : "bg-warning/10"
                      }`}>
                        {data.status === "good" ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-warning" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Current</span>
                        <span className="text-muted-foreground">Optimal: {data.optimal}%</span>
                      </div>
                      <Progress 
                        value={Math.min((data.current / data.optimal) * 100, 100)} 
                        className={`h-2 ${data.status === "good" ? "[&>div]:bg-success" : "[&>div]:bg-warning"}`} 
                      />
                      <p className="text-xs text-muted-foreground">{data.action}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Cost + Yield + Organic */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-card rounded-xl border border-border p-5">
                    <p className="text-sm text-muted-foreground mb-1">Estimated Total Cost</p>
                    <p className="text-3xl font-bold text-primary">₹{totalCost.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground mt-1">For {fieldSize} hectares</p>
                  </div>

                  <div className="bg-card rounded-xl border border-border p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-success" />
                      <p className="text-sm font-medium text-success">Expected Yield Boost</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{plan.expectedYieldBoost || "15-20%"}</p>
                    <p className="text-xs text-muted-foreground mt-1">vs standard fertilization</p>
                  </div>

                  {/* Warnings */}
                  {plan.warnings && plan.warnings.length > 0 && (
                    <div className="bg-destructive/5 rounded-xl border border-destructive/30 p-5">
                      <h4 className="text-sm font-semibold text-destructive flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4" /> Cautions
                      </h4>
                      <ul className="space-y-1">
                        {plan.warnings.map((w, i) => (
                          <li key={i} className="text-xs text-muted-foreground">⚠️ {w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Organic Alternatives */}
                  {plan.organicAlternatives && plan.organicAlternatives.length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-5">
                      <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-success" /> Organic Alternatives
                      </h3>
                      <div className="space-y-3">
                        {plan.organicAlternatives.map((alt, i) => (
                          <div key={i} className="p-3 rounded-lg bg-success/5 border border-success/20">
                            <p className="text-sm font-medium text-foreground">{alt.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{alt.benefit}</p>
                            <p className="text-xs text-success mt-1">📝 {alt.application}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Recommendations + Schedule */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Fertilizer Recommendations */}
                  <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
                      <FlaskConical className="w-5 h-5 text-warning" />
                      AI Fertilizer Recommendations
                    </h3>
                    <div className="space-y-3">
                      {plan.recommendations?.map((rec, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-xl border ${
                            rec.priority === "high" ? "bg-warning/5 border-warning/30" : "bg-muted/50 border-border"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-foreground text-sm">{rec.nutrient}</h4>
                              <p className="text-xs text-primary">{rec.product}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              rec.priority === "high" ? "bg-warning text-warning-foreground" : "bg-muted text-muted-foreground"
                            }`}>
                              {rec.priority === "high" ? "High Priority" : rec.priority === "medium" ? "Medium" : "Low"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-muted-foreground">Quantity</p>
                              <p className="font-medium text-foreground">{rec.quantity}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Cost/hectare</p>
                              <p className="font-medium text-foreground">{rec.cost}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Timing</p>
                              <p className="font-medium text-foreground">{rec.timing}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Method</p>
                              <p className="font-medium text-foreground">{rec.method}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Application Schedule
                    </h3>
                    <div className="space-y-3">
                      {plan.schedule?.map((item, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-xl border ${
                            item.status === "current" ? "bg-primary/5 border-primary/30" :
                            item.status === "upcoming" ? "bg-warning/5 border-warning/30" :
                            "bg-muted/50 border-border"
                          }`}
                        >
                          <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                            item.status === "current" ? "bg-primary text-primary-foreground" :
                            item.status === "upcoming" ? "bg-warning text-warning-foreground" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground text-sm">{item.week}</p>
                            <p className="text-xs text-muted-foreground">{item.action}</p>
                          </div>
                          {item.status === "current" && (
                            <Button size="sm" className="text-xs">Apply Now</Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
