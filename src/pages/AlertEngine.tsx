import { useState } from "react";
import { IntelligenceModule } from "@/components/intelligence/IntelligenceModule";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, Info } from "lucide-react";

export default function AlertEngine() {
  const [location, setLocation] = useState("Morobe, PNG");
  const [crops, setCrops] = useState("Maize, Sweet Potato");

  const sevIcon = (s: string) =>
    s === "critical" ? <AlertTriangle className="w-4 h-4 text-destructive" /> :
    s === "warning" ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
    <Info className="w-4 h-4 text-primary" />;

  return (
    <IntelligenceModule
      module="alerts"
      title="AI Alert Engine"
      description="Unified disease, pest, weather, market, irrigation, and soil alerts."
      icon={<Bell className="w-6 h-6" />}
      buttonLabel="Generate Live Alerts"
      getContext={() => ({ location, crops })}
      inputs={
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
          <div><Label>Crops</Label><Input value={crops} onChange={(e) => setCrops(e.target.value)} /></div>
        </div>
      }
      renderResult={(d) => (
        <>
          <Card className="p-6 grid md:grid-cols-4 gap-4">
            <div><div className="text-xs uppercase text-muted-foreground">Critical</div><div className="text-2xl font-bold text-destructive">{d.priorityCount?.critical || 0}</div></div>
            <div><div className="text-xs uppercase text-muted-foreground">Warning</div><div className="text-2xl font-bold text-amber-500">{d.priorityCount?.warning || 0}</div></div>
            <div><div className="text-xs uppercase text-muted-foreground">Info</div><div className="text-2xl font-bold text-primary">{d.priorityCount?.info || 0}</div></div>
            <div className="md:col-span-1 text-sm text-muted-foreground">{d.summary}</div>
          </Card>

          <div className="space-y-2">
            {d.alerts?.map((a: any) => (
              <Card key={a.id} className="p-4">
                <div className="flex items-start gap-3">
                  {sevIcon(a.severity)}
                  <div className="flex-1">
                    <div className="flex justify-between flex-wrap gap-2">
                      <span className="font-semibold">{a.title}</span>
                      <div className="flex gap-2"><Badge variant="outline">{a.type}</Badge><Badge variant={a.severity === "critical" ? "destructive" : "secondary"}>{a.severity}</Badge></div>
                    </div>
                    <p className="text-sm mt-1">{a.message}</p>
                    <p className="text-sm text-primary mt-1">→ {a.action}</p>
                    <div className="text-xs text-muted-foreground mt-1">⏱ {a.timeWindow} • 📍 {a.affectedArea}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    />
  );
}
