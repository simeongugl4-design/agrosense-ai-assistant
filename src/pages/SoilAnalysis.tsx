import { useState, useRef } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Loader2, Leaf, Droplets, FlaskConical, Sprout, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";

interface SoilResult {
  soilType: string;
  color: string;
  texture: string;
  moisture: string;
  organicMatter: string;
  phEstimate: string;
  healthScore: number;
  nutrients: Record<string, { level: string; status: string }>;
  enrichmentRecommendations: Array<{
    nutrient: string;
    product: string;
    quantity: string;
    method: string;
    timing: string;
    cost: string;
  }>;
  cropRecommendations: Array<{
    crop: string;
    suitability: number;
    reason: string;
    tips: string;
  }>;
  improvements: string[];
  warnings: string[];
}

export default function SoilAnalysis() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SoilResult | null>(null);
  const [location, setLocation] = useState("");
  const [currentCrops, setCurrentCrops] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { selectedLanguage } = useLanguage();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File too large", description: "Max 10MB" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("soil-analysis", {
        body: { imageBase64: selectedImage, location, currentCrops, language: selectedLanguage },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Analysis Failed", description: error instanceof Error ? error.message : "Please try again" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "Deficient") return "text-destructive";
    if (status === "Excess") return "text-warning";
    return "text-success";
  };

  const getHealthColor = (score: number) => {
    if (score >= 75) return "bg-success";
    if (score >= 50) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header title="Soil Analysis" subtitle="Upload a soil photo for AI-powered nutrient and crop analysis" />
        <main className="p-4 lg:p-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Upload */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Capture Soil Sample
              </h3>
              <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
              {!selectedImage ? (
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-foreground font-medium mb-1">Take a photo or upload soil image</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, WEBP (max 10MB)</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden">
                    <img src={selectedImage} alt="Soil sample" className="w-full h-56 object-cover" />
                    <button onClick={() => { setSelectedImage(null); setResult(null); }} className="absolute top-2 right-2 bg-destructive text-destructive-foreground w-8 h-8 rounded-lg flex items-center justify-center font-bold">×</button>
                  </div>
                </div>
              )}
              <div className="mt-4 space-y-3">
                <div>
                  <Label>Location (optional)</Label>
                  <Input placeholder="e.g., Ludhiana, Punjab" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
                <div>
                  <Label>Current/Planned Crops (optional)</Label>
                  <Input placeholder="e.g., Wheat, Rice" value={currentCrops} onChange={e => setCurrentCrops(e.target.value)} />
                </div>
              </div>
              <Button className="w-full mt-4" size="lg" onClick={handleAnalyze} disabled={isAnalyzing || !selectedImage}>
                {isAnalyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing Soil...</> : <><FlaskConical className="w-4 h-4 mr-2" />Analyze Soil</>}
              </Button>
            </div>

            {/* Results */}
            <div className="bg-card rounded-xl border border-border p-6 overflow-y-auto max-h-[85vh]">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-success" />
                Soil Analysis Report
              </h3>

              {!result && !isAnalyzing && (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <FlaskConical className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Upload a soil photo to get detailed nutrient analysis</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="flex flex-col items-center justify-center h-48">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p className="text-foreground font-medium">Analyzing soil composition...</p>
                </div>
              )}

              {result && (
                <div className="space-y-5">
                  {/* Health Score */}
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-foreground">Soil Health Score</h4>
                      <span className="text-2xl font-bold text-primary">{result.healthScore}/100</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div className={`h-3 rounded-full ${getHealthColor(result.healthScore)} transition-all`} style={{ width: `${result.healthScore}%` }} />
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Soil Type", value: result.soilType },
                      { label: "Texture", value: result.texture },
                      { label: "Moisture", value: result.moisture },
                      { label: "Organic Matter", value: result.organicMatter },
                      { label: "pH Estimate", value: result.phEstimate },
                      { label: "Color", value: result.color },
                    ].map(item => (
                      <div key={item.label} className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="text-sm font-medium text-foreground">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Nutrients */}
                  {result.nutrients && Object.keys(result.nutrients).length > 0 && (
                    <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-accent" />
                        Nutrient Analysis
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(result.nutrients).map(([key, val]) => (
                          <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-background">
                            <span className="text-sm capitalize text-foreground">{key}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{val.level}</Badge>
                              <span className={`text-xs font-medium ${getStatusColor(val.status)}`}>{val.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Enrichment */}
                  {result.enrichmentRecommendations?.length > 0 && (
                    <div className="p-4 rounded-xl bg-warning/5 border border-warning/20">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-warning" />
                        Soil Enrichment Plan
                      </h4>
                      <div className="space-y-3">
                        {result.enrichmentRecommendations.map((rec, i) => (
                          <div key={i} className="p-3 rounded-lg bg-background border border-border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm text-foreground">{rec.nutrient}</span>
                              {rec.cost && <span className="text-xs text-success font-medium">{rec.cost}</span>}
                            </div>
                            <p className="text-sm text-primary font-medium">{rec.product}</p>
                            <p className="text-xs text-muted-foreground mt-1">📏 {rec.quantity} · 📋 {rec.method}</p>
                            <p className="text-xs text-muted-foreground">⏰ {rec.timing}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Crop Recommendations */}
                  {result.cropRecommendations?.length > 0 && (
                    <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Sprout className="w-4 h-4 text-success" />
                        Best Crops for This Soil
                      </h4>
                      <div className="space-y-3">
                        {result.cropRecommendations.map((crop, i) => (
                          <div key={i} className="p-3 rounded-lg bg-background border border-border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-foreground">{crop.crop}</span>
                              <Badge variant="default" className="text-xs">{crop.suitability}% Match</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{crop.reason}</p>
                            <p className="text-xs text-primary mt-1">💡 {crop.tips}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {result.warnings?.length > 0 && (
                    <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        Warnings
                      </h4>
                      <ul className="space-y-1">
                        {result.warnings.map((w, i) => <li key={i} className="text-sm text-foreground">⚠️ {w}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Improvements */}
                  {result.improvements?.length > 0 && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Improvement Steps
                      </h4>
                      <ul className="space-y-1">
                        {result.improvements.map((imp, i) => <li key={i} className="text-sm text-foreground">✅ {imp}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
