import { useState } from "react";
import { IntelligenceModule } from "@/components/intelligence/IntelligenceModule";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Bug, AlertTriangle, ShieldCheck } from "lucide-react";

export default function PestDetection() {
  const [crop, setCrop] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [location, setLocation] = useState("");

  return (
    <IntelligenceModule
      module="pest"
      title="Pest Detection System"
      description="AI pest identification, risk scoring, and IPM treatment plans."
      icon={<Bug className="w-6 h-6" />}
      getContext={() => ({ crop, symptoms, location })}
      inputs={
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Crop</Label>
            <Input value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="e.g. Maize" />
          </div>
          <div>
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Morobe, PNG" />
          </div>
          <div className="md:col-span-2">
            <Label>Observed symptoms / pest description</Label>
            <Textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Holes in leaves, small green insects on stems…" />
          </div>
        </div>
      }
      renderResult={(d) => (
        <>
          <Card className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-2xl font-bold">{d.pest}</h2>
                <p className="text-sm italic text-muted-foreground">{d.scientificName}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">Confidence {d.confidence}%</Badge>
                <Badge variant={d.severity === "critical" || d.severity === "high" ? "destructive" : "secondary"}>
                  {d.severity}
                </Badge>
                <Badge variant="outline">Risk {d.riskScore}/100</Badge>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="text-sm">{d.earlyWarning}</div>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Damage symptoms</h3>
              <ul className="space-y-1 text-sm list-disc pl-5">
                {d.damageSymptoms?.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Prevention</h3>
              <ul className="space-y-1 text-sm list-disc pl-5">
                {d.prevention?.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Treatment options</h3>
            <div className="space-y-3">
              {d.treatments?.map((t: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border">
                  <div className="flex justify-between flex-wrap gap-2">
                    <span className="font-medium">{t.product}</span>
                    <Badge variant="outline">{t.type}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Dosage: {t.dosage} • Timing: {t.timing} • Cost: {t.cost}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 grid md:grid-cols-2 gap-4">
            <div><h3 className="font-semibold mb-2">Spread risk</h3><p className="text-sm">{d.spreadRisk}</p></div>
            <div><h3 className="font-semibold mb-2">Economic impact</h3><p className="text-sm">{d.economicImpact}</p></div>
          </Card>
        </>
      )}
    />
  );
}
