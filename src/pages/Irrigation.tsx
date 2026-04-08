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
import { useDashboardTranslations, formatDashboardText } from "@/hooks/useDashboardTranslations";

export default function Irrigation() {
  const { copy } = useDashboardTranslations();
  const [cropType, setCropType] = useState("");
  const [growthStage, setGrowthStage] = useState("");
  const [fieldSize, setFieldSize] = useState("5");
  const [soilType, setSoilType] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<IrrigationPlan | null>(null);

  const cropOptions = [
    { value: "rice", label: copy.common.cropOptions.rice },
    { value: "wheat", label: copy.common.cropOptions.wheat },
    { value: "maize", label: copy.common.cropOptions.maize },
    { value: "cotton", label: copy.common.cropOptions.cotton },
    { value: "sugarcane", label: copy.common.cropOptions.sugarcane },
    { value: "soybean", label: copy.common.cropOptions.soybean },
    { value: "potato", label: copy.common.cropOptions.potato },
    { value: "tomato", label: copy.common.cropOptions.tomato },
    { value: "onion", label: copy.common.cropOptions.onion },
    { value: "groundnut", label: copy.common.cropOptions.groundnut },
    { value: "kaukau", label: copy.common.cropOptions.kaukau },
    { value: "taro", label: copy.common.cropOptions.taro },
  ];

  const stageOptions = [
    { value: "seedling", label: copy.common.growthStages.seedling },
    { value: "vegetative", label: copy.common.growthStages.vegetative },
    { value: "flowering", label: copy.common.growthStages.flowering },
    { value: "fruiting/grain filling", label: copy.common.growthStages.fruiting },
    { value: "maturity", label: copy.common.growthStages.maturity },
  ];

  const soilOptions = [
    { value: "clay", label: copy.common.soilTypes.clay },
    { value: "sandy", label: copy.common.soilTypes.sandy },
    { value: "loamy", label: copy.common.soilTypes.loamy },
    { value: "silty", label: copy.common.soilTypes.silty },
    { value: "black soil", label: copy.common.soilTypes.blackSoil },
    { value: "red soil", label: copy.common.soilTypes.redSoil },
    { value: "alluvial", label: copy.common.soilTypes.alluvial },
  ];

  const handleGetPlan = async () => {
    if (!cropType || !growthStage) {
      toast({ variant: "destructive", title: copy.irrigation.errors.missingTitle });
      return;
    }
    setIsLoading(true);
    try {
      const data = await getIrrigationPlan({ cropType, growthStage, fieldSize, soilType, location });
      setPlan(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: copy.irrigation.errors.failedTitle,
        description: error instanceof Error ? error.message : copy.irrigation.errors.tryAgain,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header title={copy.irrigation.title} subtitle={copy.irrigation.subtitle} />

        <main className="p-4 lg:p-6">
          <div className="bg-card rounded-xl border border-border p-5 lg:p-6 mb-6 lg:mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {copy.irrigation.cardTitle}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>{copy.irrigation.labels.cropType}</Label>
                <Select value={cropType} onValueChange={setCropType}>
                  <SelectTrigger><SelectValue placeholder={copy.irrigation.placeholders.cropType} /></SelectTrigger>
                  <SelectContent>
                    {cropOptions.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{copy.irrigation.labels.growthStage}</Label>
                <Select value={growthStage} onValueChange={setGrowthStage}>
                  <SelectTrigger><SelectValue placeholder={copy.irrigation.placeholders.growthStage} /></SelectTrigger>
                  <SelectContent>
                    {stageOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{copy.irrigation.labels.fieldSize}</Label>
                <Input type="number" value={fieldSize} onChange={(e) => setFieldSize(e.target.value)} placeholder={copy.irrigation.placeholders.fieldSize} />
              </div>
              <div className="space-y-2">
                <Label>{copy.irrigation.labels.soilType}</Label>
                <Select value={soilType} onValueChange={setSoilType}>
                  <SelectTrigger><SelectValue placeholder={copy.irrigation.placeholders.soilType} /></SelectTrigger>
                  <SelectContent>
                    {soilOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{copy.irrigation.labels.location}</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={copy.irrigation.placeholders.location} />
              </div>
            </div>
            <Button className="mt-5" size="lg" onClick={handleGetPlan} disabled={isLoading || !cropType || !growthStage}>
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{copy.irrigation.buttons.loading}</> : <><Sparkles className="w-4 h-4 mr-2" />{copy.irrigation.buttons.submit}</>}
            </Button>
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-foreground font-medium">{copy.irrigation.loading.title}</p>
              <p className="text-sm text-muted-foreground">{copy.irrigation.loading.subtitle}</p>
            </div>
          )}

          {!isLoading && !plan && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Droplets className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">{copy.irrigation.empty}</p>
            </div>
          )}

          {!isLoading && plan && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-card rounded-xl border border-border p-4 lg:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs lg:text-sm text-muted-foreground">{copy.irrigation.labels.dailyNeed}</p>
                      <p className="text-xl lg:text-2xl font-bold text-foreground">{plan.dailyWaterNeed} {plan.dailyWaterUnit?.split("/")[0] || "L"}</p>
                      <p className="text-xs text-muted-foreground">{copy.irrigation.labels.perHectare}</p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Droplets className="w-5 h-5 lg:w-6 lg:h-6 text-accent" />
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 lg:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs lg:text-sm text-muted-foreground">{copy.irrigation.labels.weeklySavings}</p>
                      <p className="text-xl lg:text-2xl font-bold text-success">{plan.stats?.weeklySavings?.value || 0} {plan.stats?.weeklySavings?.unit || "L"}</p>
                      <p className="text-xs text-muted-foreground">{formatDashboardText(copy.irrigation.labels.saved, { value: plan.stats?.weeklySavings?.costSaved || 0 })}</p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-success/10 flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 lg:w-6 lg:h-6 text-success" />
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 lg:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs lg:text-sm text-muted-foreground">{copy.irrigation.labels.soilMoisture}</p>
                      <p className="text-xl lg:text-2xl font-bold text-foreground">{plan.soilMoistureTarget?.current || 65}%</p>
                      <p className="text-xs text-success">{formatDashboardText(copy.irrigation.labels.target, { min: plan.soilMoistureTarget?.min, max: plan.soilMoistureTarget?.max })}</p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Waves className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 lg:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs lg:text-sm text-muted-foreground">{copy.irrigation.labels.efficiency}</p>
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
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Waves className="w-5 h-5 text-accent" />
                      {copy.irrigation.labels.soilMoisture}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{copy.irrigation.labels.currentLevel}</span>
                        <span className="font-medium text-foreground">{plan.soilMoistureTarget?.current || 65}%</span>
                      </div>
                      <Progress value={plan.soilMoistureTarget?.current || 65} className="h-3" />
                      <p className="text-xs text-muted-foreground">
                        {formatDashboardText(copy.irrigation.labels.optimal, {
                          min: plan.soilMoistureTarget?.min || 60,
                          max: plan.soilMoistureTarget?.max || 75,
                          crop: cropType,
                        })}
                      </p>
                    </div>
                  </div>

                  {plan.method && (
                    <div className="bg-card rounded-xl border border-border p-5">
                      <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-secondary" />
                        {copy.irrigation.labels.recommendedMethod}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{plan.method}</p>
                    </div>
                  )}

                  {plan.tips && plan.tips.length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-5">
                      <h3 className="text-base font-semibold text-foreground mb-3">💡 {copy.irrigation.labels.proTips}</h3>
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

                <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
                  <h3 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    {copy.irrigation.labels.schedule}
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
                              {item.status === "rain" ? (item.notes || copy.irrigation.labels.rainExpected) : `${item.time} • ${item.duration}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {item.status !== "rain" ? (
                            <>
                              <p className="font-medium text-foreground text-sm">{item.waterAmount} L</p>
                              <p className="text-xs text-muted-foreground">{copy.irrigation.labels.waterUsage}</p>
                            </>
                          ) : (
                            <span className="text-xs text-success font-medium">{copy.irrigation.labels.savingWater}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

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
