import { useState } from "react";
import { IntelligenceModule } from "@/components/intelligence/IntelligenceModule";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Beef } from "lucide-react";

export default function LivestockMonitoring() {
  const [species, setSpecies] = useState("cattle");
  const [herdSize, setHerdSize] = useState("20");
  const [notes, setNotes] = useState("");

  return (
    <IntelligenceModule
      module="livestock"
      title="Livestock Monitoring"
      description="Herd health, anomaly detection, feed optimization, and breeding analytics."
      icon={<Beef className="w-6 h-6" />}
      buttonLabel="Analyze Herd"
      getContext={() => ({ species, herdSize: Number(herdSize), notes })}
      inputs={
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label>Species</Label><Input value={species} onChange={(e) => setSpecies(e.target.value)} /></div>
          <div><Label>Herd size</Label><Input type="number" value={herdSize} onChange={(e) => setHerdSize(e.target.value)} /></div>
          <div className="md:col-span-2"><Label>Observations</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Loss of appetite in 2 animals…" /></div>
        </div>
      }
      renderResult={(d) => (
        <>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">Herd health score</div>
            <div className="text-4xl font-bold text-primary">{d.herdHealthScore}/100</div>
            <Progress value={d.herdHealthScore} className="mt-2" />
          </Card>

          {d.alerts?.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Health alerts</h3>
              <div className="space-y-2">
                {d.alerts.map((a: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg border">
                    <div className="flex justify-between flex-wrap gap-2">
                      <span className="font-medium">#{a.animalId} — {a.issue}</span>
                      <Badge variant={a.severity === "high" ? "destructive" : "secondary"}>{a.severity}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">→ {a.action}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Feed optimization</h3>
              <div className="text-sm space-y-2">
                <div>Current: <strong>${d.feedOptimization?.currentCostPerHead}/head</strong></div>
                <div>Recommended: <strong className="text-primary">${d.feedOptimization?.recommendedCostPerHead}/head</strong></div>
                <div>Savings: {d.feedOptimization?.savings}</div>
                <ul className="list-disc pl-5 mt-2">{d.feedOptimization?.feedMix?.map((m: string, i: number) => <li key={i}>{m}</li>)}</ul>
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Breeding</h3>
              <div className="text-sm space-y-2">
                <div>Ready: <strong>{d.breeding?.readyCount}</strong></div>
                <div>Next window: {d.breeding?.nextWindow}</div>
                <div>Fertility score: {d.breeding?.fertilityScore}/100</div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">Recommendations</h3>
            <ul className="space-y-1 text-sm list-disc pl-5">{d.recommendations?.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>
          </Card>
        </>
      )}
    />
  );
}
