import { useState } from "react";
import { IntelligenceModule } from "@/components/intelligence/IntelligenceModule";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign } from "lucide-react";

export default function YieldPrediction() {
  const [crop, setCrop] = useState("");
  const [hectares, setHectares] = useState("1");
  const [stage, setStage] = useState("");
  const [location, setLocation] = useState("");

  const money = (n: number) => `$${(n || 0).toLocaleString()}`;

  return (
    <IntelligenceModule
      module="yield"
      title="Yield Prediction AI"
      description="Forecast harvest, market prices, revenue, and profitability."
      icon={<TrendingUp className="w-6 h-6" />}
      buttonLabel="Forecast Yield & Revenue"
      getContext={() => ({ crop, hectares: Number(hectares), growthStage: stage, location })}
      inputs={
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label>Crop</Label><Input value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="Maize" /></div>
          <div><Label>Hectares</Label><Input type="number" value={hectares} onChange={(e) => setHectares(e.target.value)} /></div>
          <div><Label>Growth stage</Label><Input value={stage} onChange={(e) => setStage(e.target.value)} placeholder="Flowering" /></div>
          <div><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
        </div>
      }
      renderResult={(d) => (
        <>
          <Card className="p-6 grid md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Predicted yield</div>
              <div className="text-3xl font-bold text-primary">{d.predictedYieldTonsPerHa} t/ha</div>
              <Badge variant="outline" className="mt-1">Confidence {d.confidence}%</Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total harvest</div>
              <div className="text-2xl font-bold">{d.totalHarvest}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">vs region</div>
              <div className="text-base mt-2">{d.comparedToRegion}</div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Revenue forecast</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-muted"><div className="text-xs text-muted-foreground">Low</div><div className="text-xl font-bold">{money(d.revenue?.low)}</div></div>
              <div className="p-3 rounded-lg bg-primary/10"><div className="text-xs text-muted-foreground">Expected</div><div className="text-xl font-bold text-primary">{money(d.revenue?.expected)}</div></div>
              <div className="p-3 rounded-lg bg-muted"><div className="text-xs text-muted-foreground">High</div><div className="text-xl font-bold">{money(d.revenue?.high)}</div></div>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Market price forecast</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Now</span><span className="font-medium">{money(d.marketPriceForecast?.now)}</span></div>
                <div className="flex justify-between"><span>In 30 days</span><span className="font-medium">{money(d.marketPriceForecast?.in30Days)}</span></div>
                <div className="flex justify-between"><span>In 90 days</span><span className="font-medium">{money(d.marketPriceForecast?.in90Days)}</span></div>
                <Badge className="mt-2">Trend: {d.marketPriceForecast?.trend}</Badge>
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Profitability</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Costs</span><span>{money(d.profitability?.costs)}</span></div>
                <div className="flex justify-between"><span>Gross</span><span>{money(d.profitability?.gross)}</span></div>
                <div className="flex justify-between font-semibold"><span>Net profit</span><span className="text-primary">{money(d.profitability?.net)}</span></div>
                <div className="flex justify-between"><span>Margin</span><span>{d.profitability?.marginPct}%</span></div>
              </div>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Risk factors</h3>
              <ul className="space-y-1 text-sm list-disc pl-5">{d.riskFactors?.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Yield optimizations</h3>
              <div className="space-y-2">
                {d.optimizations?.map((o: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm border-b pb-2">
                    <span>{o.action}</span><Badge variant="outline">+{o.yieldGainPct}%</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    />
  );
}
