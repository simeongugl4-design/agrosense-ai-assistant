import { useState } from "react";
import { IntelligenceModule } from "@/components/intelligence/IntelligenceModule";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Banknote } from "lucide-react";

export default function FarmFinance() {
  const [hectares, setHectares] = useState("5");
  const [crops, setCrops] = useState("");
  const [revenue, setRevenue] = useState("10000");
  const [costs, setCosts] = useState("6000");

  const money = (n: number) => `$${(n || 0).toLocaleString()}`;

  return (
    <IntelligenceModule
      module="finance"
      title="Farm Finance AI"
      description="Credit scoring, loan eligibility, profitability and risk analytics."
      icon={<Banknote className="w-6 h-6" />}
      buttonLabel="Analyze Farm Finances"
      getContext={() => ({ hectares: Number(hectares), crops, revenueYTD: Number(revenue), costsYTD: Number(costs) })}
      inputs={
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label>Hectares</Label><Input type="number" value={hectares} onChange={(e) => setHectares(e.target.value)} /></div>
          <div><Label>Crops</Label><Input value={crops} onChange={(e) => setCrops(e.target.value)} placeholder="Maize, Coffee" /></div>
          <div><Label>Revenue YTD (USD)</Label><Input type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)} /></div>
          <div><Label>Costs YTD (USD)</Label><Input type="number" value={costs} onChange={(e) => setCosts(e.target.value)} /></div>
        </div>
      }
      renderResult={(d) => (
        <>
          <Card className="p-6 grid md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Credit score</div>
              <div className="text-4xl font-bold text-primary">{d.creditScore}</div>
              <Badge className="mt-1 capitalize">{d.creditTier}</Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Loan eligibility</div>
              <div className="text-2xl font-bold">{money(d.loanEligibility?.maxAmount)}</div>
              <div className="text-sm">{d.loanEligibility?.interestRangePct} • {d.loanEligibility?.tenure}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Overall risk</div>
              <Badge variant={d.riskAssessment?.overall === "high" ? "destructive" : "secondary"} className="text-base">{d.riskAssessment?.overall}</Badge>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-3">Profitability YTD</h3>
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div><div className="text-muted-foreground">Revenue</div><div className="font-semibold">{money(d.profitability?.revenueYTD)}</div></div>
              <div><div className="text-muted-foreground">Costs</div><div className="font-semibold">{money(d.profitability?.costsYTD)}</div></div>
              <div><div className="text-muted-foreground">Net</div><div className="font-semibold text-primary">{money(d.profitability?.netYTD)}</div></div>
              <div><div className="text-muted-foreground">Margin</div><div className="font-semibold">{d.profitability?.marginPct}%</div></div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-3">Risk breakdown</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              {["climate", "market", "operational"].map((k) => (
                <div key={k} className="p-3 rounded-lg border">
                  <div className="text-xs uppercase text-muted-foreground">{k}</div>
                  <Badge variant={d.riskAssessment?.[k] === "high" ? "destructive" : "secondary"} className="mt-1">{d.riskAssessment?.[k]}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-3">Recommended lenders</h3>
            <div className="space-y-2">
              {d.recommendedLenders?.map((l: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border">
                  <div className="flex justify-between flex-wrap gap-2">
                    <span className="font-medium">{l.name} — {l.product}</span>
                    <Badge variant="outline">{l.ratePct}% APR</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{l.fit}</div>
                </div>
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
