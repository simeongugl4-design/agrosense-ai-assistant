import { useState, useRef } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Leaf, AlertTriangle, CheckCircle, Loader2, Stethoscope, Bug, FlaskConical, Sprout, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";

interface ChemicalProduct {
  name: string;
  activeIngredient: string;
  dosage: string;
  applicationMethod: string;
  frequency: string;
  waitingPeriod: string;
  safetyPrecautions: string;
}

interface DiseaseResult {
  cropIdentification: {
    name: string;
    scientificName: string;
    family: string;
    growthStage: string;
    overallHealth: string;
  };
  disease: string;
  confidence: number;
  severity: string;
  symptoms: string[];
  diseaseInfo: {
    causedBy: string;
    type: string;
    spreadMethod: string;
    affectedParts: string[];
    progressionRate: string;
  };
  treatment: {
    immediate: string;
    organic: string;
    chemical: { products: ChemicalProduct[] };
  };
  prevention: string;
  cropInfo: {
    optimalConditions: string;
    waterNeeds: string;
    nutrientNeeds: string;
    commonPests: string[];
    companionPlants: string[];
    harvestIndicators: string;
  };
  expertNeeded: boolean;
  expertReason: string;
}

export default function DiseaseScanner() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [cropType, setCropType] = useState("");
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
      reader.onloadend = () => { setSelectedImage(reader.result as string); setResult(null); };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("disease-detection", {
        body: { imageBase64: selectedImage || undefined, cropType: cropType || undefined, symptoms: symptoms || undefined, language: selectedLanguage },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Analysis Failed", description: error instanceof Error ? error.message : "Try again" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "severe": case "critical": return "bg-destructive/10 text-destructive border-destructive/30";
      case "moderate": return "bg-warning/10 text-warning border-warning/30";
      case "mild": case "none": return "bg-success/10 text-success border-success/30";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health?.toLowerCase()) {
      case "healthy": return "bg-success/10 text-success";
      case "stressed": return "bg-warning/10 text-warning";
      case "diseased": case "critical": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header title="Leaf & Disease Scanner" subtitle="Identify crops, detect diseases, and get treatment recommendations" />
        <main className="p-4 lg:p-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Upload Section */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Scan Crop Leaf
              </h3>
              <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
              {!selectedImage ? (
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-foreground font-medium mb-1">Take a photo of the leaf or crop</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, WEBP (max 10MB)</p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={selectedImage} alt="Crop" className="w-full h-56 object-cover" />
                  <button onClick={() => { setSelectedImage(null); setResult(null); }} className="absolute top-2 right-2 bg-destructive text-destructive-foreground w-8 h-8 rounded-lg flex items-center justify-center font-bold">×</button>
                </div>
              )}
              <div className="mt-4 space-y-3">
                <div><Label>Crop Type (optional)</Label><Input placeholder="e.g., Tomato, Rice, Wheat" value={cropType} onChange={e => setCropType(e.target.value)} /></div>
                <div><Label>Describe Symptoms (optional)</Label><Input placeholder="e.g., Yellow spots on leaves" value={symptoms} onChange={e => setSymptoms(e.target.value)} /></div>
              </div>
              <Button className="w-full mt-4" size="lg" onClick={handleAnalyze} disabled={isAnalyzing || (!selectedImage && !symptoms)}>
                {isAnalyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</> : <><Stethoscope className="w-4 h-4 mr-2" />Analyze Crop</>}
              </Button>
            </div>

            {/* Results */}
            <div className="bg-card rounded-xl border border-border p-6 overflow-y-auto max-h-[85vh]">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-success" />
                Complete Analysis
              </h3>

              {!result && !isAnalyzing && (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <Leaf className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Upload an image for complete crop & disease analysis</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="flex flex-col items-center justify-center h-48">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p className="text-foreground font-medium">AI is analyzing your crop...</p>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  {/* Crop Identification */}
                  {result.cropIdentification && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Sprout className="w-4 h-4 text-primary" /> Crop Identified
                      </h4>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-foreground">{result.cropIdentification.name}</span>
                        <Badge className={`text-xs ${getHealthBadge(result.cropIdentification.overallHealth)}`}>
                          {result.cropIdentification.overallHealth}
                        </Badge>
                      </div>
                      {result.cropIdentification.scientificName && (
                        <p className="text-xs text-muted-foreground italic">{result.cropIdentification.scientificName}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Family: {result.cropIdentification.family} · Stage: {result.cropIdentification.growthStage}</p>
                    </div>
                  )}

                  {/* Disease Diagnosis */}
                  <div className={`p-4 rounded-xl border ${getSeverityColor(result.severity)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Diagnosis</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-background/50">{result.severity}</span>
                        <span className="text-xs font-medium">{result.confidence}%</span>
                      </div>
                    </div>
                    <p className="font-bold text-lg">{result.disease}</p>
                    {result.diseaseInfo && (
                      <div className="mt-2 text-xs space-y-1">
                        <p>🦠 Caused by: {result.diseaseInfo.causedBy} ({result.diseaseInfo.type})</p>
                        <p>📡 Spreads via: {result.diseaseInfo.spreadMethod}</p>
                        <p>🎯 Affects: {result.diseaseInfo.affectedParts?.join(", ")}</p>
                        <p>⏱️ Progression: {result.diseaseInfo.progressionRate}</p>
                      </div>
                    )}
                    {result.symptoms?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs opacity-80 font-medium">Symptoms:</p>
                        <ul className="text-xs list-disc list-inside opacity-80">{result.symptoms.map((s, i) => <li key={i}>{s}</li>)}</ul>
                      </div>
                    )}
                  </div>

                  {/* Immediate Action */}
                  <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
                    <h4 className="font-semibold text-warning flex items-center gap-2 mb-2">⚡ Immediate Action</h4>
                    <p className="text-sm text-foreground leading-relaxed">{result.treatment?.immediate}</p>
                  </div>

                  {/* Chemical Treatment */}
                  {result.treatment?.chemical?.products?.length > 0 && (
                    <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                      <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                        <FlaskConical className="w-4 h-4 text-destructive" /> Chemical Treatment
                      </h4>
                      <div className="space-y-3">
                        {result.treatment.chemical.products.map((prod, i) => (
                          <div key={i} className="p-3 rounded-lg bg-background border border-border">
                            <p className="font-semibold text-sm text-foreground">{prod.name}</p>
                            <p className="text-xs text-primary">Active: {prod.activeIngredient}</p>
                            <div className="grid grid-cols-2 gap-1 mt-2 text-xs text-muted-foreground">
                              <p>💊 Dosage: {prod.dosage}</p>
                              <p>🔄 Frequency: {prod.frequency}</p>
                              <p>📋 Method: {prod.applicationMethod}</p>
                              <p>⏳ Wait: {prod.waitingPeriod}</p>
                            </div>
                            <p className="text-xs text-destructive mt-2">⚠️ {prod.safetyPrecautions}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Organic Treatment */}
                  <div className="p-4 rounded-xl bg-success/10 border border-success/30">
                    <h4 className="font-semibold text-success flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4" /> Organic Treatment
                    </h4>
                    <p className="text-sm text-foreground leading-relaxed">{result.treatment?.organic}</p>
                  </div>

                  {/* Crop Info */}
                  {result.cropInfo && (
                    <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                      <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                        <Info className="w-4 h-4 text-accent" /> Crop Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        {result.cropInfo.optimalConditions && <p>🌤️ <span className="font-medium">Conditions:</span> {result.cropInfo.optimalConditions}</p>}
                        {result.cropInfo.waterNeeds && <p>💧 <span className="font-medium">Water:</span> {result.cropInfo.waterNeeds}</p>}
                        {result.cropInfo.nutrientNeeds && <p>🧪 <span className="font-medium">Nutrients:</span> {result.cropInfo.nutrientNeeds}</p>}
                        {result.cropInfo.commonPests?.length > 0 && <p>🐛 <span className="font-medium">Common Pests:</span> {result.cropInfo.commonPests.join(", ")}</p>}
                        {result.cropInfo.companionPlants?.length > 0 && <p>🌱 <span className="font-medium">Companion Plants:</span> {result.cropInfo.companionPlants.join(", ")}</p>}
                        {result.cropInfo.harvestIndicators && <p>🌾 <span className="font-medium">Harvest Signs:</span> {result.cropInfo.harvestIndicators}</p>}
                      </div>
                    </div>
                  )}

                  {/* Prevention */}
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2"><Leaf className="w-4 h-4 text-primary" /> Prevention</h4>
                    <p className="text-sm text-foreground leading-relaxed">{result.prevention}</p>
                  </div>

                  {/* Expert */}
                  {result.expertNeeded && (
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                      <h4 className="font-semibold text-destructive flex items-center gap-2 mb-2">👨‍🌾 Expert Consultation Recommended</h4>
                      <p className="text-sm text-foreground">{result.expertReason}</p>
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
