import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Leaf, AlertTriangle, CheckCircle, Loader2, Stethoscope, FlaskConical, Sprout, Info, ListChecks, ShieldCheck, Users, TrendingUp, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";
import { useDashboardTranslations } from "@/hooks/useDashboardTranslations";
import { getGuestId, getGuestName } from "@/lib/guest-id";

interface ChemicalProduct {
  name: string;
  activeIngredient: string;
  dosage: string;
  applicationMethod: string;
  frequency: string;
  waitingPeriod: string;
  safetyPrecautions: string;
}

interface TreatmentStep {
  step: number;
  title: string;
  action: string;
  timing: string;
  materials?: string[];
  expectedOutcome?: string;
}

interface PreventionStep {
  step: number;
  title: string;
  action: string;
  timing: string;
  frequency?: string;
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
  confidenceBreakdown?: {
    visualMatch: number;
    symptomMatch: number;
    contextMatch: number;
    rationale: string;
  };
  severity: string;
  symptoms: string[];
  differentialDiagnoses?: { name: string; confidence: number; distinguishingFeature: string }[];
  similarCases?: { scenario: string; outcome: string; timeToRecover: string }[];
  diseaseInfo: {
    causedBy: string;
    type: string;
    spreadMethod: string;
    affectedParts: string[];
    progressionRate: string;
  };
  treatment: {
    immediate: string;
    stepByStep?: TreatmentStep[];
    organic: string;
    chemical: { products: ChemicalProduct[] };
    estimatedRecoveryTime?: string;
    successRate?: number;
  };
  preventionPlan?: { summary: string; steps: PreventionStep[] };
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
  const [trackedCaseId, setTrackedCaseId] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { selectedLanguage } = useLanguage();
  const { copy, format } = useDashboardTranslations();

  const trackCase = async () => {
    if (!result) return;
    setTracking(true);
    try {
      const guestId = getGuestId();
      let photoUrl: string | null = null;
      if (selectedImage && selectedImage.startsWith("data:")) {
        const blob = await (await fetch(selectedImage)).blob();
        const path = `${guestId}/initial-${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("disease-photos")
          .upload(path, blob, { contentType: blob.type || "image/jpeg" });
        if (!upErr) {
          photoUrl = supabase.storage.from("disease-photos").getPublicUrl(path).data.publicUrl;
        }
      }
      const summary = [
        result.treatment?.immediate,
        result.treatment?.estimatedRecoveryTime
          ? `Recovery: ${result.treatment.estimatedRecoveryTime}`
          : "",
      ].filter(Boolean).join(" ");

      const { data, error } = await supabase
        .from("disease_cases")
        .insert({
          owner_id: guestId,
          owner_name: getGuestName(),
          crop: result.cropIdentification?.name || cropType || "Unknown crop",
          disease: result.disease,
          initial_severity: result.severity,
          initial_confidence: result.confidence,
          initial_photo_url: photoUrl,
          initial_summary: summary,
          initial_result: result as any,
          status: "active",
        })
        .select()
        .single();
      if (error) throw error;

      const next = new Date();
      next.setDate(next.getDate() + 5);
      await supabase.from("disease_followups").insert({
        case_id: data.id,
        owner_id: guestId,
        scheduled_date: next.toISOString().slice(0, 10),
        status: "scheduled",
      });

      setTrackedCaseId(data.id);
      toast({ title: "Case tracked", description: "First check-in scheduled in 5 days." });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Could not track case",
        description: e instanceof Error ? e.message : "Try again",
      });
    } finally {
      setTracking(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: copy.diseaseScanner.errors.fileTooLarge,
          description: copy.diseaseScanner.errors.fileTooLargeDescription,
        });
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
    setIsAnalyzing(true);
    setResult(null);
    setTrackedCaseId(null);
    try {
      const { data, error } = await supabase.functions.invoke("disease-detection", {
        body: { imageBase64: selectedImage || undefined, cropType: cropType || undefined, symptoms: symptoms || undefined, language: selectedLanguage },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: copy.diseaseScanner.errors.failedTitle,
        description: error instanceof Error ? error.message : copy.diseaseScanner.errors.tryAgain,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "severe":
      case "critical":
        return "bg-destructive/10 text-destructive border-destructive/30";
      case "moderate":
        return "bg-warning/10 text-warning border-warning/30";
      case "mild":
      case "none":
        return "bg-success/10 text-success border-success/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health?.toLowerCase()) {
      case "healthy":
        return "bg-success/10 text-success";
      case "stressed":
        return "bg-warning/10 text-warning";
      case "diseased":
      case "critical":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header title={copy.diseaseScanner.title} subtitle={copy.diseaseScanner.subtitle} />
        <main className="p-4 lg:p-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                {copy.diseaseScanner.uploadTitle}
              </h3>
              <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
              {!selectedImage ? (
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-foreground font-medium mb-1">{copy.diseaseScanner.uploadPrompt}</p>
                  <p className="text-xs text-muted-foreground">{copy.diseaseScanner.uploadHint}</p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={selectedImage} alt="Crop" className="w-full h-56 object-cover" />
                  <button onClick={() => { setSelectedImage(null); setResult(null); }} className="absolute top-2 right-2 bg-destructive text-destructive-foreground w-8 h-8 rounded-lg flex items-center justify-center font-bold">×</button>
                </div>
              )}
              <div className="mt-4 space-y-3">
                <div>
                  <Label>{copy.diseaseScanner.labels.cropType}</Label>
                  <Input placeholder={copy.diseaseScanner.placeholders.cropType} value={cropType} onChange={(e) => setCropType(e.target.value)} />
                </div>
                <div>
                  <Label>{copy.diseaseScanner.labels.symptomsLabel}</Label>
                  <Input placeholder={copy.diseaseScanner.placeholders.symptoms} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
                </div>
              </div>
              <Button className="w-full mt-4" size="lg" onClick={handleAnalyze} disabled={isAnalyzing || (!selectedImage && !symptoms)}>
                {isAnalyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{copy.diseaseScanner.buttons.loading}</> : <><Stethoscope className="w-4 h-4 mr-2" />{copy.diseaseScanner.buttons.submit}</>}
              </Button>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 overflow-y-auto max-h-[85vh]">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-success" />
                {copy.diseaseScanner.resultTitle}
              </h3>

              {!result && !isAnalyzing && (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <Leaf className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">{copy.diseaseScanner.empty}</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="flex flex-col items-center justify-center h-48">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p className="text-foreground font-medium">{copy.diseaseScanner.loading}</p>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2 text-sm">
                      <Activity className="w-4 h-4 text-accent mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Track this case over time</p>
                        <p className="text-xs text-muted-foreground">Schedule check-ins and re-upload photos to monitor recovery.</p>
                      </div>
                    </div>
                    {trackedCaseId ? (
                      <Link to="/dashboard/followups">
                        <Button size="sm" variant="outline">Open follow-ups</Button>
                      </Link>
                    ) : (
                      <Button size="sm" onClick={trackCase} disabled={tracking}>
                        {tracking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Track this case"}
                      </Button>
                    )}
                  </div>
                  {result.cropIdentification && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Sprout className="w-4 h-4 text-primary" /> {copy.diseaseScanner.labels.cropIdentified}
                      </h4>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-foreground">{result.cropIdentification.name}</span>
                        <Badge className={`text-xs ${getHealthBadge(result.cropIdentification.overallHealth)}`}>
                          {result.cropIdentification.overallHealth}
                        </Badge>
                      </div>
                      {result.cropIdentification.scientificName && <p className="text-xs text-muted-foreground italic">{result.cropIdentification.scientificName}</p>}
                      <p className="text-xs text-muted-foreground">
                        {format(copy.diseaseScanner.labels.familyStage, {
                          family: result.cropIdentification.family,
                          stage: result.cropIdentification.growthStage,
                        })}
                      </p>
                    </div>
                  )}

                  <div className={`p-4 rounded-xl border ${getSeverityColor(result.severity)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {copy.diseaseScanner.labels.diagnosis}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-background/50">{result.severity}</span>
                        <span className="text-xs font-medium">{result.confidence}%</span>
                      </div>
                    </div>
                    <p className="font-bold text-lg">{result.disease}</p>
                    {result.diseaseInfo && (
                      <div className="mt-2 text-xs space-y-1">
                        <p>🦠 {copy.diseaseScanner.labels.causedBy}: {result.diseaseInfo.causedBy} ({result.diseaseInfo.type})</p>
                        <p>📡 {copy.diseaseScanner.labels.spreadsVia}: {result.diseaseInfo.spreadMethod}</p>
                        <p>🎯 {copy.diseaseScanner.labels.affects}: {result.diseaseInfo.affectedParts?.join(", ")}</p>
                        <p>⏱️ {copy.diseaseScanner.labels.progression}: {result.diseaseInfo.progressionRate}</p>
                      </div>
                    )}
                    {result.symptoms?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs opacity-80 font-medium">{copy.diseaseScanner.labels.symptoms}:</p>
                        <ul className="text-xs list-disc list-inside opacity-80">{result.symptoms.map((s, i) => <li key={i}>{s}</li>)}</ul>
                      </div>
                    )}
                  </div>

                  {result.confidenceBreakdown && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-primary" /> Confidence breakdown
                      </h4>
                      <div className="space-y-2 text-xs">
                        {[
                          { label: "Visual match", value: result.confidenceBreakdown.visualMatch },
                          { label: "Symptom match", value: result.confidenceBreakdown.symptomMatch },
                          { label: "Context match", value: result.confidenceBreakdown.contextMatch },
                        ].map((b) => (
                          <div key={b.label}>
                            <div className="flex justify-between mb-1"><span>{b.label}</span><span className="font-medium">{b.value}%</span></div>
                            <Progress value={b.value} className="h-1.5" />
                          </div>
                        ))}
                      </div>
                      {result.confidenceBreakdown.rationale && (
                        <p className="text-xs text-muted-foreground mt-3 italic">{result.confidenceBreakdown.rationale}</p>
                      )}
                    </div>
                  )}

                  {result.differentialDiagnoses && result.differentialDiagnoses.length > 0 && (
                    <div className="p-4 rounded-xl bg-muted/40 border border-border">
                      <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                        <ListChecks className="w-4 h-4 text-primary" /> Other possibilities
                      </h4>
                      <div className="space-y-2">
                        {result.differentialDiagnoses.map((d, i) => (
                          <div key={i} className="p-2 rounded-lg bg-background border border-border">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{d.name}</span>
                              <span className="text-xs text-muted-foreground">{d.confidence}%</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{d.distinguishingFeature}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
                    <h4 className="font-semibold text-warning flex items-center gap-2 mb-2">⚡ {copy.diseaseScanner.labels.immediateAction}</h4>
                    <p className="text-sm text-foreground leading-relaxed">{result.treatment?.immediate}</p>
                  </div>

                  {result.treatment?.stepByStep && result.treatment.stepByStep.length > 0 && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <ListChecks className="w-4 h-4 text-primary" /> Step-by-step treatment plan
                        </h4>
                        {result.treatment.successRate ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">{result.treatment.successRate}% success</span>
                        ) : null}
                      </div>
                      <ol className="space-y-3">
                        {result.treatment.stepByStep.map((s) => (
                          <li key={s.step} className="flex gap-3">
                            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{s.step}</div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-foreground">{s.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">⏰ {s.timing}</p>
                              <p className="text-sm text-foreground mt-1">{s.action}</p>
                              {s.materials && s.materials.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">🧰 {s.materials.join(", ")}</p>
                              )}
                              {s.expectedOutcome && (
                                <p className="text-xs text-success mt-1">✓ {s.expectedOutcome}</p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ol>
                      {result.treatment.estimatedRecoveryTime && (
                        <p className="text-xs text-muted-foreground mt-3">Estimated recovery: <span className="font-medium text-foreground">{result.treatment.estimatedRecoveryTime}</span></p>
                      )}
                    </div>
                  )}

                  {result.treatment?.chemical?.products?.length > 0 && (
                    <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                      <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                        <FlaskConical className="w-4 h-4 text-destructive" /> {copy.diseaseScanner.labels.chemicalTreatment}
                      </h4>
                      <div className="space-y-3">
                        {result.treatment.chemical.products.map((prod, i) => (
                          <div key={i} className="p-3 rounded-lg bg-background border border-border">
                            <p className="font-semibold text-sm text-foreground">{prod.name}</p>
                            <p className="text-xs text-primary">{copy.diseaseScanner.labels.active}: {prod.activeIngredient}</p>
                            <div className="grid grid-cols-2 gap-1 mt-2 text-xs text-muted-foreground">
                              <p>💊 {copy.diseaseScanner.labels.dosage}: {prod.dosage}</p>
                              <p>🔄 {copy.diseaseScanner.labels.frequency}: {prod.frequency}</p>
                              <p>📋 {copy.diseaseScanner.labels.method}: {prod.applicationMethod}</p>
                              <p>⏳ {copy.diseaseScanner.labels.wait}: {prod.waitingPeriod}</p>
                            </div>
                            <p className="text-xs text-destructive mt-2">⚠️ {prod.safetyPrecautions}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-success/10 border border-success/30">
                    <h4 className="font-semibold text-success flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4" /> {copy.diseaseScanner.labels.organicTreatment}
                    </h4>
                    <p className="text-sm text-foreground leading-relaxed">{result.treatment?.organic}</p>
                  </div>

                  {result.cropInfo && (
                    <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                      <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                        <Info className="w-4 h-4 text-accent" /> {copy.diseaseScanner.labels.cropInformation}
                      </h4>
                      <div className="space-y-2 text-sm">
                        {result.cropInfo.optimalConditions && <p>🌤️ <span className="font-medium">{copy.diseaseScanner.labels.conditions}:</span> {result.cropInfo.optimalConditions}</p>}
                        {result.cropInfo.waterNeeds && <p>💧 <span className="font-medium">{copy.diseaseScanner.labels.water}:</span> {result.cropInfo.waterNeeds}</p>}
                        {result.cropInfo.nutrientNeeds && <p>🧪 <span className="font-medium">{copy.diseaseScanner.labels.nutrients}:</span> {result.cropInfo.nutrientNeeds}</p>}
                        {result.cropInfo.commonPests?.length > 0 && <p>🐛 <span className="font-medium">{copy.diseaseScanner.labels.commonPests}:</span> {result.cropInfo.commonPests.join(", ")}</p>}
                        {result.cropInfo.companionPlants?.length > 0 && <p>🌱 <span className="font-medium">{copy.diseaseScanner.labels.companionPlants}:</span> {result.cropInfo.companionPlants.join(", ")}</p>}
                        {result.cropInfo.harvestIndicators && <p>🌾 <span className="font-medium">{copy.diseaseScanner.labels.harvestSigns}:</span> {result.cropInfo.harvestIndicators}</p>}
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2"><Leaf className="w-4 h-4 text-primary" /> {copy.diseaseScanner.labels.prevention}</h4>
                    <p className="text-sm text-foreground leading-relaxed">{result.preventionPlan?.summary || result.prevention}</p>
                    {result.preventionPlan?.steps && result.preventionPlan.steps.length > 0 && (
                      <ol className="mt-3 space-y-2">
                        {result.preventionPlan.steps.map((s) => (
                          <li key={s.step} className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success/20 text-success text-xs font-bold flex items-center justify-center">{s.step}</div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{s.title}</p>
                              <p className="text-xs text-muted-foreground">⏰ {s.timing}{s.frequency ? ` · ${s.frequency}` : ""}</p>
                              <p className="text-sm text-foreground mt-0.5">{s.action}</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                  {result.similarCases && result.similarCases.length > 0 && (
                    <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                      <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-accent" /> Similar cases
                      </h4>
                      <div className="space-y-2">
                        {result.similarCases.map((c, i) => (
                          <div key={i} className="p-3 rounded-lg bg-background border border-border">
                            <p className="text-sm text-foreground">{c.scenario}</p>
                            <p className="text-xs text-success mt-1">✓ {c.outcome}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">⏱ {c.timeToRecover}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.expertNeeded && (
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                      <h4 className="font-semibold text-destructive flex items-center gap-2 mb-2">👨‍🌾 {copy.diseaseScanner.labels.expertConsultation}</h4>
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
