import { useState } from "react";
import { IntelligenceModule } from "@/components/intelligence/IntelligenceModule";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Satellite, Activity, Droplets } from "lucide-react";

export default function SatelliteMonitoring() {
  const [farm, setFarm] = useState("");
  const [crop, setCrop] = useState("");
  const [hectares, setHectares] = useState("5");
  const [location, setLocation] = useState("");

  return (
    <IntelligenceModule
      module="satellite"
      title="Satellite Farm Monitoring"
      description="NDVI analysis, water stress detection, and vegetation health from satellite imagery."
      icon={<Satellite className="w-6 h-6" />}
      buttonLabel="Run Satellite Analysis"
      getContext={() => ({ farm, crop, hectares: Number(hectares), location })}
      inputs={
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label>Farm name</Label><Input value={farm} onChange={(e) => setFarm(e.target.value)} placeholder="North Field" /></div>
          <div><Label>Crop</Label><Input value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="Maize" /></div>
          <div><Label>Hectares</Label><Input type="number" value={hectares} onChange={(e) => setHectares(e.target.value)} /></div>
          <div><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Morobe, PNG" /></div>
        </div>
      }
      renderResult={(d) => (
        <>
          <Card className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Current NDVI</div>
                <div className="text-3xl font-bold text-primary">{d.ndvi?.current?.toFixed(2)}</div>
                <Badge variant="outline" className="mt-1">{d.ndvi?.trend}</Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Health score</div>
                <div className="text-3xl font-bold">{d.healthScore}/100</div>
                <Progress value={d.healthScore} className="mt-2" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="text-2xl font-semibold capitalize">{d.healthStatus}</div>
                <div className="text-sm mt-1">Growth: {d.growthStage}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Droplets className="w-4 h-4" /> Water stress</h3>
            <div className="flex items-center gap-3">
              <Badge variant={d.waterStress?.level === "severe" ? "destructive" : "secondary"}>
                {d.waterStress?.level}
              </Badge>
              <span className="text-sm">Affected: {d.waterStress?.affectedHectares} ha</span>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-3">Vegetation zones</h3>
            <div className="grid md:grid-cols-5 gap-3">
              {d.vegetationZones?.map((z: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border text-center">
                  <div className="text-xs uppercase text-muted-foreground">{z.zone}</div>
                  <div className="text-xl font-bold text-primary">{z.ndvi?.toFixed(2)}</div>
                  <div className="text-xs mt-1">{z.status}</div>
                </div>
              ))}
            </div>
          </Card>

          {d.anomalies?.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Activity className="w-4 h-4" /> Anomalies</h3>
              <div className="space-y-2">
                {d.anomalies.map((a: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg border">
                    <div className="flex justify-between flex-wrap gap-2">
                      <span className="font-medium">{a.type}</span>
                      <Badge variant="outline">{a.severity}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">→ {a.action}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="font-semibold mb-2">Recommendations</h3>
            <ul className="space-y-1 text-sm list-disc pl-5">{d.recommendations?.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>
            <p className="text-sm text-muted-foreground mt-3 italic">Forecast: {d.forecast}</p>
          </Card>
        </>
      )}
    />
  );
}
