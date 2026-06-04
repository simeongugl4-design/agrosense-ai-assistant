import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  ShieldCheck, Download, FileText, History, GitCompare, Trash2, Loader2, ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getGuestId } from "@/lib/guest-id";
import { toast } from "@/hooks/use-toast";
import { downloadSafetyPdf } from "@/lib/safety-pdf";

interface PlanRow {
  id: string;
  product: string;
  product_key: string;
  crop: string | null;
  dosage: string | null;
  overall_risk: string | null;
  safe_to_proceed: boolean | null;
  tank_mix_verdict: string | null;
  summary: string | null;
  version: number;
  inputs: any;
  result: any;
  created_at: string;
}

const riskClass = (r: string | null) => {
  switch (r) {
    case "critical": return "bg-destructive text-destructive-foreground";
    case "high": return "bg-destructive/10 text-destructive border-destructive/30";
    case "moderate": return "bg-warning/10 text-warning border-warning/30";
    case "low": return "bg-success/10 text-success border-success/30";
    default: return "bg-muted text-muted-foreground";
  }
};

export default function SafetyRecords() {
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const load = async () => {
    setLoading(true);
    const owner = getGuestId();
    const { data, error } = await (supabase as any)
      .from("safety_plans")
      .select("*")
      .eq("owner_id", owner)
      .order("created_at", { ascending: false });
    if (error) toast({ variant: "destructive", title: "Couldn't load records", description: error.message });
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const groups = useMemo(() => {
    const m = new Map<string, PlanRow[]>();
    for (const r of rows) {
      const k = r.product_key || r.product.toLowerCase();
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    return Array.from(m.entries()).map(([k, items]) => ({
      key: k,
      product: items[0].product,
      latest: items[0],
      items: items.sort((a, b) => b.version - a.version),
    }));
  }, [rows]);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const deleteRow = async (id: string) => {
    if (!confirm("Delete this record? PDF stays on your device.")) return;
    const { error } = await (supabase as any).from("safety_plans").delete().eq("id", id);
    if (error) return toast({ variant: "destructive", title: "Delete failed", description: error.message });
    toast({ title: "Record deleted" });
    setRows((r) => r.filter((x) => x.id !== id));
    setCompareIds((c) => c.filter((x) => x !== id));
  };

  const redownload = (r: PlanRow) => {
    downloadSafetyPdf({ inputs: r.inputs, result: r.result });
  };

  const compareSelected = rows.filter((r) => compareIds.includes(r.id));

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header title="Safety Plan Records" subtitle="Reopen, compare, and re-download past mixing plans" />
        <main className="p-4 lg:p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <History className="w-4 h-4" /> {rows.length} record{rows.length === 1 ? "" : "s"} · {groups.length} product{groups.length === 1 ? "" : "s"}
            </div>
            <div className="flex items-center gap-2">
              {compareIds.length > 0 && (
                <Badge variant="outline">{compareIds.length}/2 selected</Badge>
              )}
              <Button
                size="sm"
                disabled={compareIds.length !== 2}
                onClick={() => setShowCompare(true)}
              >
                <GitCompare className="w-4 h-4 mr-2" /> Compare versions
              </Button>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!loading && rows.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <ShieldCheck className="w-16 h-16 mx-auto text-muted-foreground/30 mb-3" />
              <p className="font-medium">No saved plans yet</p>
              <p className="text-sm text-muted-foreground">Generate a safety plan and download its PDF — it'll be saved here automatically.</p>
            </div>
          )}

          <div className="space-y-3">
            {groups.map((g) => {
              const open = openGroup === g.key;
              return (
                <div key={g.key} className="bg-card border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenGroup(open ? null : g.key)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <ChevronRight className={`w-4 h-4 transition ${open ? "rotate-90" : ""}`} />
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold">{g.product}</p>
                        <p className="text-xs text-muted-foreground">
                          {g.items.length} version{g.items.length === 1 ? "" : "s"} · Latest: v{g.latest.version} · {new Date(g.latest.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={`uppercase text-xs ${riskClass(g.latest.overall_risk)}`}>{g.latest.overall_risk || "—"}</Badge>
                  </button>

                  {open && (
                    <div className="border-t border-border divide-y divide-border">
                      {g.items.map((r) => {
                        const checked = compareIds.includes(r.id);
                        return (
                          <div key={r.id} className="p-4 flex items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-1.5 accent-primary"
                              checked={checked}
                              onChange={() => toggleCompare(r.id)}
                              aria-label="Select to compare"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold">v{r.version}</span>
                                <Badge variant="outline" className={`uppercase text-[10px] ${riskClass(r.overall_risk)}`}>{r.overall_risk || "—"}</Badge>
                                {r.tank_mix_verdict && (
                                  <Badge variant="outline" className="text-[10px] uppercase">{r.tank_mix_verdict.replace("_", " ")}</Badge>
                                )}
                                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                              </div>
                              <p className="text-sm mt-1 line-clamp-2">{r.summary}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {r.crop && <>Crop: {r.crop} · </>}{r.dosage && <>Dosage: {r.dosage}</>}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <Button size="sm" variant="outline" onClick={() => redownload(r)}>
                                <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteRow(r.id)}>
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>

      <Dialog open={showCompare} onOpenChange={setShowCompare}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compare versions</DialogTitle>
            <DialogDescription>Side-by-side snapshot of two safety plans.</DialogDescription>
          </DialogHeader>
          {compareSelected.length === 2 && (
            <div className="grid grid-cols-2 gap-4">
              {compareSelected
                .sort((a, b) => a.version - b.version)
                .map((r) => (
                  <div key={r.id} className="border border-border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">v{r.version}</span>
                      <Badge className={`uppercase text-[10px] ${riskClass(r.overall_risk)}`}>{r.overall_risk}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                    <div className="text-xs space-y-1">
                      <p><b>Product:</b> {r.product}</p>
                      <p><b>Dosage:</b> {r.dosage || "—"}</p>
                      <p><b>Crop / Stage:</b> {r.crop || "—"} / {r.inputs?.growthStage || "—"}</p>
                      <p><b>Tank-mix:</b> {r.tank_mix_verdict || "—"}</p>
                      <p><b>Safe to proceed:</b> {r.safe_to_proceed ? "Yes" : "No"}</p>
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold mt-2">Summary</p>
                      <p className="text-muted-foreground">{r.summary}</p>
                    </div>
                    {r.result?.actionChecklist?.length > 0 && (
                      <div className="text-xs">
                        <p className="font-semibold mt-2">Actions</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                          {r.result.actionChecklist.slice(0, 5).map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    <Button size="sm" variant="outline" className="w-full" onClick={() => redownload(r)}>
                      <Download className="w-3.5 h-3.5 mr-1.5" /> Download PDF
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
