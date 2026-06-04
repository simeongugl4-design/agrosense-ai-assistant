import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Download, Loader2, GitCompare, Plus, Minus, Equal, AlertTriangle, ShieldCheck,
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

const norm = (s: string) => s.trim().toLowerCase();

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
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border ${cls}`}>
      <Icon className="w-3 h-3" /> {children}
    </span>
  );
}

export default function SafetyCompare() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
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
      const sorted = (data || []).sort(
        (a: PlanRow, b: PlanRow) => ids.indexOf(a.id) - ids.indexOf(b.id),
      );
      setRows(sorted);
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
              <p className="font-medium mb-2">Pick two records to compare</p>
              <Button asChild><Link to="/dashboard/safety-records">Go to records</Link></Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const [A, B] := [rows[0], rows[1]] as any; // (placeholder to satisfy parser — replaced below)
}
