import { useState } from "react";
import { IntelligenceModule } from "@/components/intelligence/IntelligenceModule";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Landmark } from "lucide-react";

export default function Subsidies() {
  const [country, setCountry] = useState("Papua New Guinea");
  const [hectares, setHectares] = useState("5");
  const [crops, setCrops] = useState("");
  const [farmerType, setFarmerType] = useState("smallholder");

  return (
    <IntelligenceModule
      module="subsidies"
      title="Government Program Discovery"
      description="AI-matched subsidies, grants, and application assistance."
      icon={<Landmark className="w-6 h-6" />}
      buttonLabel="Find Eligible Programs"
      getContext={() => ({ country, hectares: Number(hectares), crops, farmerType })}
      inputs={
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label>Country</Label><Input value={country} onChange={(e) => setCountry(e.target.value)} /></div>
          <div><Label>Farmer type</Label><Input value={farmerType} onChange={(e) => setFarmerType(e.target.value)} /></div>
          <div><Label>Hectares</Label><Input type="number" value={hectares} onChange={(e) => setHectares(e.target.value)} /></div>
          <div><Label>Crops</Label><Input value={crops} onChange={(e) => setCrops(e.target.value)} /></div>
        </div>
      }
      renderResult={(d) => (
        <>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">Total potential support</div>
            <div className="text-3xl font-bold text-primary">${d.totalPotentialUSD?.toLocaleString()}</div>
          </Card>

          <div className="space-y-3">
            {d.eligiblePrograms?.map((p: any, i: number) => (
              <Card key={i} className="p-5">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">{p.provider}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge>{p.amount}</Badge>
                    <Badge variant="outline">Match {p.matchScore}%</Badge>
                    <Badge variant="secondary">Deadline: {p.deadline}</Badge>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Requirements</p>
                    <ul className="text-sm list-disc pl-5 space-y-1">{p.requirements?.map((r: string, j: number) => <li key={j}>{r}</li>)}</ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Application steps</p>
                    <ol className="text-sm list-decimal pl-5 space-y-1">{p.applicationSteps?.map((s: string, j: number) => <li key={j}>{s}</li>)}</ol>
                  </div>
                </div>
              </Card>
            ))}
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
