import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Download, Loader2, GitCompare, Plus, Minus, Equal, AlertTriangle, ShieldCheck, ShieldAlert,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getGuestId } from "@/lib/guest-id";
import { toast } from "@/hooks/use-toast";
import { downloadSafetyPdf } from "@/lib/safety-pdf";

interface PlanRow {
  id: string;
  product: string;
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

const riskClass = (r: string | null | undefined) => {
  switch (r) {
    case "critical": return "bg-destructive text-destructive-foreground";
    case "high": return "bg-destructive/10 text-destructive border-destructive/30";
    case "moderate": return "bg-warning/10 text-warning border-warning/30";
    case "low": return "bg-success/10 text-success border-success/30";
    default: return "bg-muted text-muted-foreground";
  }
};

const norm = (s: string) => (s || "").trim().toLowerCase();

function diffLists(a: string[] = [], b: string[] = []) {
  const setA = new Set(a.map(norm));
  const setB = new Set(b.map(norm));
  const onlyA = a.filter((x) => !setB.has(norm(x)));
  const onlyB = b.filter((x) => !setA.has(norm(x)));
  const both = a.filter((x) => setB.has(norm(x)));
  return { onlyA, onlyB, both };
}

function ChangeChip({ kind, children }: { kind: "added" | "removed" | "same"; children: React.ReactNode }) {
  const cls =
    kind === "added"
      ? "bg-success/10 text-success border-success/30"
      : kind === "removed"
        ? "bg-destructive/10 text-destructive border-destructive/30"
        : "bg-muted text-muted-foreground border-border";
  const Icon = kind === "added" ? Plus : kind === "removed" ? Minus : Equal;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border ${cls}`}>
      <Icon className="w-3 h-3" /> {children}
    </span>
  );
}

function DiffPanel({
  title, icon: Icon, listA, listB, labelA, labelB, emptyHint,
}: {
  title: string;
  icon: any;
  listA: string[];
  listB: string[];
  labelA: string;
  labelB: string;
  emptyHint?: string;
}) {
  const { onlyA, onlyB, both } = diffLists(listA, listB);
  const noChanges = onlyA.length === 0 && onlyB.length === 0;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" /> {title}
        </h3>
        {noChanges ? (
          <Badge variant="outline" className="text-xs"><Equal className="w-3 h-3 mr-1" /> No changes</Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            {onlyA.length + onlyB.length} change{onlyA.length + onlyB.length === 1 ? "" : "s"}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1.5">{labelA}</p>
          <div className="flex flex-wrap gap-1.5">
            {listA.length === 0 && <span className="text-muted-foreground italic">{emptyHint || "None"}</span>}
            {listA.map((x, i) => {
              const removed = onlyA.some((y) => norm(y) === norm(x));
              return <ChangeChip key={i} kind={removed ? "removed" : "same"}>{x}</ChangeChip>;
            })}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1.5">{labelB}</p>
          <div className="flex flex-wrap gap-1.5">
            {listB.length === 0 && <span className="text-muted-foreground italic">{emptyHint || "None"}</span>}
            {listB.map((x, i) => {
              const added = onlyB.some((y) => norm(y) === norm(x));
              return <ChangeChip key={i} kind={added ? "added" : "same"}>{x}</ChangeChip>;
            })}
          </div>
        </div>
      </div>

      {!noChanges && (
        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-border text-xs">
          <div>
            <p className="text-[10px] uppercase font-semibold text-destructive mb-1">Removed in newer</p>
            {onlyA.length === 0 ? <span className="text-muted-foreground">—</span>
              : <div className="flex flex-wrap gap-1.5">{onlyA.map((x, i) => <ChangeChip key={i} kind="removed">{x}</ChangeChip>)}</div>}
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-success mb-1">Added in newer</p>
            {onlyB.length === 0 ? <span className="text-muted-foreground">—</span>
              : <div className="flex flex-wrap gap-1.5">{onlyB.map((x, i) => <ChangeChip key={i} kind="added">{x}</ChangeChip>)}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SafetyCompare() {
  const [params] = useSearchParams();
  const ids = useMemo(() => (params.get("ids") || "").split(",").filter(Boolean), [params]);

  const [rows, setRows] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (ids.length !== 2) { setLoading(false); return; }
      const owner = getGuestId();
      const { data, error } = await (supabase as any)
        .from("safety_plans")
        .select("*")
        .eq("owner_id", owner)
        .in("id", ids);
      if (error) toast({ variant: "destructive", title: "Load failed", description: error.message });
      setRows(data || []);
      setLoading(false);
    })();
  }, [ids.join(",")]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="lg:ml-64 flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (rows.length !== 2) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="lg:ml-64">
          <Header title="Compare versions" subtitle="Select two records to compare" />
          <main className="p-6">
            <div className="bg-card border border-border rounded-xl p-10 text-center">
              <GitCompare className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="font-medium mb-2">Pick exactly two records to compare.</p>
              <Button asChild><Link to="/dashboard/safety-records">Go to records</Link></Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Order older → newer
  const sorted = [...rows].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  const A = sorted[0]; // older
  const B = sorted[1]; // newer

  const verdictChanged = A.tank_mix_verdict !== B.tank_mix_verdict;
  const riskChanged = A.overall_risk !== B.overall_risk;
  const safetyChanged = A.safe_to_proceed !== B.safe_to_proceed;
  const dosageChanged = (A.dosage || "") !== (B.dosage || "");

  const ppeA: string[] = A.result?.ppe || [];
  const ppeB: string[] = B.result?.ppe || [];
  const dnmA: string[] = A.result?.tankMix?.doNotMixWith || [];
  const dnmB: string[] = B.result?.tankMix?.doNotMixWith || [];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header title="Compare safety plans" subtitle={`${A.product} · v${A.version} → v${B.version}`} />
        <main className="p-4 lg:p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/safety-records"><ArrowLeft className="w-4 h-4 mr-1.5" /> Back to records</Link>
            </Button>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => downloadSafetyPdf({ inputs: A.inputs, result: A.result })}>
                <Download className="w-3.5 h-3.5 mr-1.5" /> v{A.version} PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadSafetyPdf({ inputs: B.inputs, result: B.result })}>
                <Download className="w-3.5 h-3.5 mr-1.5" /> v{B.version} PDF
              </Button>
            </div>
          </div>

          {/* Snapshot headers */}
          <div className="grid grid-cols-2 gap-4">
            {[A, B].map((r, i) => (
              <div key={r.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">v{r.version} {i === 0 ? "(older)" : "(newer)"}</span>
                  <Badge className={`uppercase text-[10px] ${riskClass(r.overall_risk)}`}>{r.overall_risk}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                <p className="text-sm mt-2 line-clamp-3">{r.summary}</p>
              </div>
            ))}
          </div>

          {/* Key changes summary */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-warning" /> Key changes
            </h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <DiffField
                label="Tank-mix verdict"
                a={A.tank_mix_verdict || "—"}
                b={B.tank_mix_verdict || "—"}
                changed={verdictChanged}
              />
              <DiffField
                label="Overall risk"
                a={A.overall_risk || "—"}
                b={B.overall_risk || "—"}
                changed={riskChanged}
              />
              <DiffField
                label="Safe to proceed"
                a={A.safe_to_proceed ? "Yes" : "No"}
                b={B.safe_to_proceed ? "Yes" : "No"}
                changed={safetyChanged}
              />
              <DiffField
                label="Dosage"
                a={A.dosage || "—"}
                b={B.dosage || "—"}
                changed={dosageChanged}
              />
            </div>
          </div>

          <DiffPanel
            title="Do-not-mix list"
            icon={ShieldAlert}
            listA={dnmA}
            listB={dnmB}
            labelA={`v${A.version}`}
            labelB={`v${B.version}`}
            emptyHint="No restrictions listed"
          />

          <DiffPanel
            title="PPE required"
            icon={ShieldCheck}
            listA={ppeA}
            listB={ppeB}
            labelA={`v${A.version}`}
            labelB={`v${B.version}`}
            emptyHint="No PPE specified"
          />
        </main>
      </div>
    </div>
  );
}

function DiffField({ label, a, b, changed }: { label: string; a: string; b: string; changed: boolean }) {
  return (
    <div className={`p-3 rounded-lg border ${changed ? "border-warning/40 bg-warning/5" : "border-border bg-background"}`}>
      <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2 text-sm">
        <span className={changed ? "line-through text-destructive" : ""}>{a}</span>
        {changed && <span className="text-muted-foreground">→</span>}
        {changed && <span className="font-semibold text-success">{b}</span>}
        {!changed && <Badge variant="outline" className="text-[10px] ml-auto">unchanged</Badge>}
      </div>
    </div>
  );
}
