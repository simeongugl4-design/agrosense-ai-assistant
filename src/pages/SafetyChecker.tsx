import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert, ShieldCheck, Loader2, Droplets, Plus, Trash2, AlertTriangle,
  CheckCircle2, Clock, Beaker, Leaf, ListChecks,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";

interface WaterSource { type: string; distanceMeters: number; }
interface ExistingTreatment { product: string; activeIngredient: string; daysAgo: number; }

interface SafetyResult {
  overallRisk: "low" | "moderate" | "high" | "critical";
  safeToProceed: boolean;
  summary: string;
  dosageCheck: { status: string; recommendedDosage: string; notes: string };
  waterSourceWarnings: { source: string; distanceMeters: number; requiredBufferMeters: number; severity: string; message: string }[];
  restrictions: { type: string; title: string; detail: string; severity: string }[];
  compatibility: { withProduct: string; status: string; waitDays: number; reason: string }[];
  ppe: string[];
  buffers: { waterMeters: number; beehiveMeters: number; dwellingMeters: number };
  preHarvestIntervalDays: number;
  reEntryIntervalHours: number;
  saferAlternatives: { name: string; type: string; reason: string }[];
  actionChecklist: string[];
}

const riskStyle = (r: string) => {
  switch (r) {
    case "critical": return "bg-destructive text-destructive-foreground";
    case "high": return "bg-destructive/10 text-destructive border-destructive/30";
    case "moderate": return "bg-warning/10 text-warning border-warning/30";
    case "low": return "bg-success/10 text-success border-success/30";
    default: return "bg-muted text-muted-foreground";
  }
};

export default function SafetyChecker() {
  const { selectedLanguage } = useLanguage();
  const [product, setProduct] = useState("");
  const [activeIngredient, setActiveIngredient] = useState("");
  const [dosage, setDosage] = useState("");
  const [crop, setCrop] = useState("");
  const [growthStage, setGrowthStage] = useState("");
  const [applicationMethod, setApplicationMethod] = useState("Foliar spray");
  const [waterSources, setWaterSources] = useState<WaterSource[]>([{ type: "Stream", distanceMeters: 50 }]);
  const [existing, setExisting] = useState<ExistingTreatment[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SafetyResult | null>(null);

  const addWater = () => setWaterSources([...waterSources, { type: "Well", distanceMeters: 30 }]);
  const removeWater = (i: number) => setWaterSources(waterSources.filter((_, idx) => idx !== i));
  const addTreatment = () => setExisting([...existing, { product: "", activeIngredient: "", daysAgo: 1 }]);
  const removeTreatment = (i: number) => setExisting(existing.filter((_, idx) => idx !== i));

  const run = async () => {
    if (!product) {
      toast({ variant: "destructive", title: "Product required", description: "Enter the product or treatment name." });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("safety-checker", {
        body: {
          product, activeIngredient, dosage, crop, growthStage, applicationMethod,
          waterSources, existingTreatments: existing,
          language: selectedLanguage,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      toast({ variant: "destructive", title: "Check failed", description: e instanceof Error ? e.message : "Try again" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header title="Safety & Dosage Checker" subtitle="Verify pesticide safety, water buffers, and compatibility" />
        <main className="p-4 lg:p-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* INPUTS */}
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Beaker className="w-5 h-5 text-primary" /> Treatment details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Product name *</Label>
                  <Input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g. Mancozeb 80WP" />
                </div>
                <div className="col-span-2">
                  <Label>Active ingredient</Label>
                  <Input value={activeIngredient} onChange={(e) => setActiveIngredient(e.target.value)} placeholder="e.g. Mancozeb" />
                </div>
                <div>
                  <Label>Dosage</Label>
                  <Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="2g/L" />
                </div>
                <div>
                  <Label>Application method</Label>
                  <Input value={applicationMethod} onChange={(e) => setApplicationMethod(e.target.value)} />
                </div>
                <div>
                  <Label>Crop</Label>
                  <Input value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="Kaukau" />
                </div>
                <div>
                  <Label>Growth stage</Label>
                  <Input value={growthStage} onChange={(e) => setGrowthStage(e.target.value)} placeholder="Flowering" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="flex items-center gap-2"><Droplets className="w-4 h-4 text-primary" /> Nearby water sources</Label>
                  <Button size="sm" variant="outline" onClick={addWater}><Plus className="w-3 h-3 mr-1" />Add</Button>
                </div>
                <div className="space-y-2">
                  {waterSources.map((w, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={w.type} onChange={(e) => { const c = [...waterSources]; c[i].type = e.target.value; setWaterSources(c); }} placeholder="Stream/Well/Pond" />
                      <Input type="number" value={w.distanceMeters} onChange={(e) => { const c = [...waterSources]; c[i].distanceMeters = +e.target.value; setWaterSources(c); }} className="w-24" placeholder="m" />
                      <Button size="icon" variant="ghost" onClick={() => removeWater(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="flex items-center gap-2"><Leaf className="w-4 h-4 text-primary" /> Recent treatments</Label>
                  <Button size="sm" variant="outline" onClick={addTreatment}><Plus className="w-3 h-3 mr-1" />Add</Button>
                </div>
                <div className="space-y-2">
                  {existing.map((t, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2">
                      <Input className="col-span-5" value={t.product} onChange={(e) => { const c = [...existing]; c[i].product = e.target.value; setExisting(c); }} placeholder="Product" />
                      <Input className="col-span-4" value={t.activeIngredient} onChange={(e) => { const c = [...existing]; c[i].activeIngredient = e.target.value; setExisting(c); }} placeholder="Active" />
                      <Input className="col-span-2" type="number" value={t.daysAgo} onChange={(e) => { const c = [...existing]; c[i].daysAgo = +e.target.value; setExisting(c); }} placeholder="Days ago" />
                      <Button size="icon" variant="ghost" className="col-span-1" onClick={() => removeTreatment(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  ))}
                  {existing.length === 0 && <p className="text-xs text-muted-foreground">None — add any sprays from the past 30 days.</p>}
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={run} disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Checking...</> : <><ShieldCheck className="w-4 h-4 mr-2" />Run safety check</>}
              </Button>
            </div>

            {/* RESULT */}
            <div className="bg-card rounded-xl border border-border p-6 overflow-y-auto max-h-[85vh]">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-warning" /> Safety report
              </h3>

              {!result && !loading && (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <ShieldCheck className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Enter a treatment to get a safety verdict.</p>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center h-48">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p className="font-medium">Evaluating safety...</p>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border ${riskStyle(result.overallRisk)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold uppercase text-sm">{result.overallRisk} risk</span>
                      {result.safeToProceed
                        ? <Badge className="bg-success/20 text-success">Safe to proceed</Badge>
                        : <Badge className="bg-destructive/20 text-destructive">Do not proceed</Badge>}
                    </div>
                    <p className="text-sm">{result.summary}</p>
                  </div>

                  {result.dosageCheck && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <h4 className="font-semibold flex items-center gap-2 mb-2"><Beaker className="w-4 h-4 text-primary" /> Dosage check</h4>
                      <p className="text-sm"><span className="font-medium capitalize">{result.dosageCheck.status.replace("_", " ")}</span> · Recommended: {result.dosageCheck.recommendedDosage || "—"}</p>
                      {result.dosageCheck.notes && <p className="text-xs text-muted-foreground mt-1">{result.dosageCheck.notes}</p>}
                    </div>
                  )}

                  {result.waterSourceWarnings?.length > 0 && (
                    <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                      <h4 className="font-semibold flex items-center gap-2 mb-2"><Droplets className="w-4 h-4 text-destructive" /> Water source warnings</h4>
                      <div className="space-y-2">
                        {result.waterSourceWarnings.map((w, i) => (
                          <div key={i} className="text-sm p-2 rounded-lg bg-background border border-border">
                            <p className="font-medium">{w.source} — {w.distanceMeters}m (need ≥ {w.requiredBufferMeters}m)</p>
                            <p className="text-xs text-muted-foreground">{w.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.restrictions?.length > 0 && (
                    <div className="p-4 rounded-xl bg-warning/5 border border-warning/30">
                      <h4 className="font-semibold flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-warning" /> Restrictions</h4>
                      <div className="space-y-2">
                        {result.restrictions.map((r, i) => (
                          <div key={i} className="text-sm">
                            <p className="font-medium">{r.title} <span className="text-xs uppercase text-muted-foreground">[{r.type}]</span></p>
                            <p className="text-xs text-muted-foreground">{r.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.compatibility?.length > 0 && (
                    <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                      <h4 className="font-semibold flex items-center gap-2 mb-2"><Beaker className="w-4 h-4 text-accent" /> Compatibility</h4>
                      <div className="space-y-2">
                        {result.compatibility.map((c, i) => (
                          <div key={i} className="text-sm flex items-start gap-2">
                            {c.status === "compatible" ? <CheckCircle2 className="w-4 h-4 text-success mt-0.5" /> : c.status === "wait" ? <Clock className="w-4 h-4 text-warning mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />}
                            <div>
                              <p className="font-medium">{c.withProduct} — <span className="capitalize">{c.status}</span>{c.waitDays ? ` (wait ${c.waitDays}d)` : ""}</p>
                              <p className="text-xs text-muted-foreground">{c.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-muted/40 border border-border">
                      <p className="text-xs text-muted-foreground">Pre-harvest interval</p>
                      <p className="font-semibold">{result.preHarvestIntervalDays} days</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40 border border-border">
                      <p className="text-xs text-muted-foreground">Re-entry interval</p>
                      <p className="font-semibold">{result.reEntryIntervalHours} hours</p>
                    </div>
                  </div>

                  {result.buffers && (
                    <div className="p-4 rounded-xl bg-muted/30 border border-border">
                      <h4 className="font-semibold mb-2">Required buffers</h4>
                      <div className="grid grid-cols-3 gap-2 text-xs text-center">
                        <div><p className="font-bold text-base">{result.buffers.waterMeters}m</p><p className="text-muted-foreground">Water</p></div>
                        <div><p className="font-bold text-base">{result.buffers.beehiveMeters}m</p><p className="text-muted-foreground">Beehives</p></div>
                        <div><p className="font-bold text-base">{result.buffers.dwellingMeters}m</p><p className="text-muted-foreground">Dwellings</p></div>
                      </div>
                    </div>
                  )}

                  {result.ppe?.length > 0 && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <h4 className="font-semibold mb-2">PPE required</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.ppe.map((p, i) => <Badge key={i} variant="secondary">{p}</Badge>)}
                      </div>
                    </div>
                  )}

                  {result.saferAlternatives?.length > 0 && (
                    <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                      <h4 className="font-semibold flex items-center gap-2 mb-2"><Leaf className="w-4 h-4 text-success" /> Safer alternatives</h4>
                      {result.saferAlternatives.map((a, i) => (
                        <div key={i} className="text-sm mb-1">
                          <p className="font-medium">{a.name} <span className="text-xs text-muted-foreground">({a.type})</span></p>
                          <p className="text-xs text-muted-foreground">{a.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.actionChecklist?.length > 0 && (
                    <div className="p-4 rounded-xl bg-muted/40 border border-border">
                      <h4 className="font-semibold flex items-center gap-2 mb-2"><ListChecks className="w-4 h-4 text-primary" /> Action checklist</h4>
                      <ul className="text-sm space-y-1">
                        {result.actionChecklist.map((s, i) => (
                          <li key={i} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /><span>{s}</span></li>
                        ))}
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
