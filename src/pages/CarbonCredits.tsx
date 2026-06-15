import { useState } from "react";
import { IntelligenceModule } from "@/components/intelligence/IntelligenceModule";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf } from "lucide-react";

export default function CarbonCredits() {
  const [hectares, setHectares] = useState("5");
  const [practices, setPractices] = useState("");

  return (
    <IntelligenceModule
      module="carbon"
      title="Carbon Credit Platform"
      description="Track carbon sequestration, ESG rating, and credit marketplace value."
      icon={<Leaf className="w-6 h-6" />}
      buttonLabel="Estimate Carbon Credits"
      getContext={() => ({ hectares: Number(hectares), practices })}
      inputs={
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label>Hectares</Label><Input type="number" value={hectares} onChange={(e) => setHectares(e.target.value)} /></div>
          <div><Label>Current practices</Label><Input value={practices} onChange={(e) => setPractices(e.target.value)} placeholder="cover crops, no-till" /></div>
        </div>
      }
      renderResult={(d) => (
        <>
          <Card className="p-6 grid md:grid-cols-4 gap-4">
            <div><div className="text-sm text-muted-foreground">CO₂ sequestered</div><div className="text-2xl font-bold text-primary">{d.sequesteredTonsCO2} t</div></div>
            <div><div className="text-sm text-muted-foreground">Credits earned</div><div className="text-2xl font-bold">{d.creditsEarned}</div></div>
            <div><div className="text-sm text-muted-foreground">Market value</div><div className="text-2xl font-bold">${d.creditValueUSD?.toLocaleString()}</div></div>
            <div><div className="text-sm text-muted-foreground">ESG rating</div><Badge className="text-lg">{d.esgRating}</Badge></div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-3">Sustainability score: {d.sustainabilityScore}/100</h3>
            <p className="text-sm text-muted-foreground">Verification: {d.verificationStatus}</p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-3">Practices</h3>
            <div className="space-y-2">
              {d.practices?.map((p: any, i: number) => (
                <div key={i} className="flex justify-between text-sm border-b pb-2">
                  <span>{p.name}</span>
                  <div className="flex gap-2"><span>{p.impactTons}t CO₂</span><Badge variant={p.status === "active" ? "default" : "outline"}>{p.status}</Badge></div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-3">Marketplaces</h3>
            <div className="space-y-2">
              {d.marketplaces?.map((m: any, i: number) => (
                <div key={i} className="flex justify-between text-sm border-b pb-2"><span>{m.name}</span><span>${m.pricePerTon}/t</span></div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">Recommendations</h3>
            <ul className="space-y-1 text-sm list-disc pl-5">{d.recommendations?.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>
          </Card>
        </>
      )}
    />
  );
}
