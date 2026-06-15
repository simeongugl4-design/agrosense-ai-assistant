import { useState, ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";

interface Props {
  module: string;
  title: string;
  description: string;
  icon: ReactNode;
  inputs: ReactNode;
  getContext: () => Record<string, unknown>;
  renderResult: (data: any) => ReactNode;
  buttonLabel?: string;
}

export function IntelligenceModule({
  module,
  title,
  description,
  icon,
  inputs,
  getContext,
  renderResult,
  buttonLabel = "Run AI Analysis",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { selectedLanguage } = useLanguage();

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("farm-intelligence", {
        body: { module, context: getContext(), language: selectedLanguage || "English" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: e instanceof Error ? e.message : "Try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header title={title} subtitle={description} />
        <main className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold font-serif">{title}</h1>
              <p className="text-muted-foreground mt-1">{description}</p>
            </div>
          </div>

          <Card className="p-6 space-y-4">
            {inputs}
            <Button onClick={run} disabled={loading} className="w-full" size="lg">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing with AI…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> {buttonLabel}
                </>
              )}
            </Button>
          </Card>

          {result && <div className="space-y-4">{renderResult(result)}</div>}
        </main>
      </div>
    </div>
  );
}
