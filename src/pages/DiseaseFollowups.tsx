import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Activity, Calendar as CalendarIcon, Camera, ChevronRight, Loader2, Plus,
  TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle, ArrowLeft, Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getGuestId, getGuestName } from "@/lib/guest-id";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "@/hooks/use-toast";
import { format as fmt, differenceInDays, addDays } from "date-fns";

interface DiseaseCase {
  id: string;
  crop: string;
  disease: string;
  initial_severity: string | null;
  initial_confidence: number | null;
  initial_photo_url: string | null;
  initial_summary: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Followup {
  id: string;
  case_id: string;
  scheduled_date: string;
  completed_at: string | null;
  photo_url: string | null;
  notes: string | null;
  farmer_progress_rating: string | null;
  ai_assessment: any;
  ai_summary: string | null;
  status: string;
  created_at: string;
}

const trendIcon = (t?: string) =>
  t === "improving" || t === "resolved" ? <TrendingUp className="w-4 h-4 text-success" />
  : t === "worsening" ? <TrendingDown className="w-4 h-4 text-destructive" />
  : <Minus className="w-4 h-4 text-muted-foreground" />;

export default function DiseaseFollowups() {
  const { selectedLanguage } = useLanguage();
  const [cases, setCases] = useState<DiseaseCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCase, setActiveCase] = useState<DiseaseCase | null>(null);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<string>(
    fmt(addDays(new Date(), 3), "yyyy-MM-dd"),
  );
  const [checkInOpen, setCheckInOpen] = useState<Followup | null>(null);
  const [checkInPhoto, setCheckInPhoto] = useState<string | null>(null);
  const [checkInNotes, setCheckInNotes] = useState("");
  const [checkInRating, setCheckInRating] = useState<string>("about_same");
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const guestId = getGuestId();

  useEffect(() => {
    void loadCases();
  }, []);

  async function loadCases() {
    setLoading(true);
    const { data, error } = await supabase
      .from("disease_cases")
      .select("*")
      .eq("owner_id", guestId)
      .order("updated_at", { ascending: false });
    if (error) {
      toast({ variant: "destructive", title: "Could not load cases", description: error.message });
    }
    setCases((data as DiseaseCase[]) || []);
    setLoading(false);
  }

  async function loadFollowups(caseId: string) {
    const { data } = await supabase
      .from("disease_followups")
      .select("*")
      .eq("case_id", caseId)
      .order("scheduled_date", { ascending: true });
    setFollowups((data as Followup[]) || []);
  }

  function openCase(c: DiseaseCase) {
    setActiveCase(c);
    void loadFollowups(c.id);
  }

  async function scheduleCheckIn() {
    if (!activeCase) return;
    setScheduling(true);
    const { error } = await supabase.from("disease_followups").insert({
      case_id: activeCase.id,
      owner_id: guestId,
      scheduled_date: scheduleDate,
      status: "scheduled",
    });
    setScheduling(false);
    if (error) {
      toast({ variant: "destructive", title: "Failed to schedule", description: error.message });
      return;
    }
    toast({ title: "Check-in scheduled", description: fmt(new Date(scheduleDate), "PPP") });
    void loadFollowups(activeCase.id);
  }

  async function uploadPhoto(file: File): Promise<string | null> {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${guestId}/${activeCase?.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("disease-photos").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
      return null;
    }
    const { data } = supabase.storage.from("disease-photos").getPublicUrl(path);
    return data.publicUrl;
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Max 10MB" });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setCheckInPhoto(reader.result as string);
    reader.readAsDataURL(f);
  }

  async function submitCheckIn() {
    if (!checkInOpen || !activeCase) return;
    setSubmittingCheckIn(true);
    try {
      let photoUrl: string | null = checkInOpen.photo_url;
      if (checkInPhoto && fileRef.current?.files?.[0]) {
        photoUrl = await uploadPhoto(fileRef.current.files[0]);
      }

      const previous = followups
        .filter((f) => f.completed_at)
        .slice(-3)
        .map((f) => ({
          date: f.completed_at,
          severity: f.ai_assessment?.currentSeverity,
          trend: f.ai_assessment?.trend,
          summary: f.ai_summary,
          rating: f.farmer_progress_rating,
        }));

      const startDate = new Date(activeCase.created_at);
      const lastDone = followups
        .filter((f) => f.completed_at)
        .sort((a, b) => +new Date(b.completed_at!) - +new Date(a.completed_at!))[0];

      const { data: ai, error: aiErr } = await supabase.functions.invoke("disease-followup", {
        body: {
          caseSummary: activeCase.initial_summary,
          crop: activeCase.crop,
          disease: activeCase.disease,
          initialSeverity: activeCase.initial_severity,
          daysSinceStart: differenceInDays(new Date(), startDate),
          daysSinceLastFollowup: lastDone
            ? differenceInDays(new Date(), new Date(lastDone.completed_at!))
            : null,
          previousFollowups: previous,
          newPhotoBase64: checkInPhoto,
          farmerNotes: checkInNotes,
          farmerProgressRating: checkInRating,
          language: selectedLanguage,
        },
      });
      if (aiErr) throw aiErr;

      const trend = ai?.trend;
      const newStatus = trend === "resolved" ? "resolved" : "active";

      const { error: upErr } = await supabase
        .from("disease_followups")
        .update({
          completed_at: new Date().toISOString(),
          photo_url: photoUrl,
          notes: checkInNotes,
          farmer_progress_rating: checkInRating,
          ai_assessment: ai,
          ai_summary: ai?.summary || null,
          status: "completed",
        })
        .eq("id", checkInOpen.id);
      if (upErr) throw upErr;

      await supabase
        .from("disease_cases")
        .update({ status: newStatus })
        .eq("id", activeCase.id);

      // Auto-schedule next follow-up if AI suggests
      if (ai?.nextFollowupInDays && newStatus !== "resolved") {
        await supabase.from("disease_followups").insert({
          case_id: activeCase.id,
          owner_id: guestId,
          scheduled_date: fmt(addDays(new Date(), Number(ai.nextFollowupInDays) || 5), "yyyy-MM-dd"),
          status: "scheduled",
        });
      }

      toast({ title: "Check-in saved", description: ai?.summary?.slice(0, 120) || "" });
      setCheckInOpen(null);
      setCheckInPhoto(null);
      setCheckInNotes("");
      setCheckInRating("about_same");
      void loadFollowups(activeCase.id);
      void loadCases();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Could not save check-in",
        description: e instanceof Error ? e.message : "Try again",
      });
    } finally {
      setSubmittingCheckIn(false);
    }
  }

  async function deleteCase(id: string) {
    if (!confirm("Delete this tracked case and all its check-ins?")) return;
    await supabase.from("disease_cases").delete().eq("id", id);
    setActiveCase(null);
    void loadCases();
  }

  async function deleteFollowup(id: string) {
    await supabase.from("disease_followups").delete().eq("id", id);
    if (activeCase) void loadFollowups(activeCase.id);
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header
          title="Disease Follow-ups"
          subtitle="Track recovery over time with scheduled check-ins"
        />
        <main className="p-4 lg:p-6">
          {!activeCase ? (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
                <Activity className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Track every diagnosis</p>
                  <p className="text-muted-foreground">
                    After scanning a diseased crop, save it as a case to schedule check-ins
                    and re-upload photos. The AI compares progress and tells you what's next.
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : cases.length === 0 ? (
                <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
                  <Activity className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-foreground font-medium">No tracked cases yet</p>
                  <p className="text-sm text-muted-foreground">
                    Open a diagnosis in the Disease Scanner and tap "Track this case".
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {cases.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => openCase(c)}
                      className="text-left bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-foreground">{c.disease}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.crop} · started {fmt(new Date(c.created_at), "PP")}
                          </p>
                        </div>
                        <Badge
                          className={
                            c.status === "resolved"
                              ? "bg-success/10 text-success"
                              : "bg-primary/10 text-primary"
                          }
                        >
                          {c.status}
                        </Badge>
                      </div>
                      {c.initial_summary && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {c.initial_summary}
                        </p>
                      )}
                      <div className="mt-3 flex justify-end text-xs text-primary items-center gap-1">
                        Open <ChevronRight className="w-3 h-3" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setActiveCase(null)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> All cases
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteCase(activeCase.id)}>
                  <Trash2 className="w-4 h-4 mr-1" /> Delete case
                </Button>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-start gap-4">
                  {activeCase.initial_photo_url && (
                    <img
                      src={activeCase.initial_photo_url}
                      alt="Initial"
                      className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-foreground">{activeCase.disease}</h2>
                      <Badge
                        className={
                          activeCase.status === "resolved"
                            ? "bg-success/10 text-success"
                            : "bg-primary/10 text-primary"
                        }
                      >
                        {activeCase.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activeCase.crop} · started {fmt(new Date(activeCase.created_at), "PPP")}
                      {activeCase.initial_severity ? ` · initial: ${activeCase.initial_severity}` : ""}
                    </p>
                    {activeCase.initial_summary && (
                      <p className="text-sm text-foreground mt-2">{activeCase.initial_summary}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" /> Schedule a check-in
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Label className="text-xs">Date</Label>
                    <Input
                      type="date"
                      value={scheduleDate}
                      min={fmt(new Date(), "yyyy-MM-dd")}
                      onChange={(e) => setScheduleDate(e.target.value)}
                    />
                  </div>
                  <Button onClick={scheduleCheckIn} disabled={scheduling} className="sm:self-end">
                    {scheduling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Schedule
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Timeline</h3>
                {followups.length === 0 && (
                  <p className="text-sm text-muted-foreground">No check-ins yet.</p>
                )}
                {followups.map((f) => {
                  const overdue =
                    f.status === "scheduled" &&
                    new Date(f.scheduled_date) < new Date(fmt(new Date(), "yyyy-MM-dd"));
                  return (
                    <div
                      key={f.id}
                      className={`bg-card border rounded-xl p-4 ${
                        overdue ? "border-warning/40" : "border-border"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground text-sm">
                              {fmt(new Date(f.scheduled_date), "PPP")}
                            </span>
                            {f.status === "completed" ? (
                              <Badge className="bg-success/10 text-success">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Done
                              </Badge>
                            ) : overdue ? (
                              <Badge className="bg-warning/10 text-warning">
                                <AlertTriangle className="w-3 h-3 mr-1" /> Overdue
                              </Badge>
                            ) : (
                              <Badge className="bg-muted text-muted-foreground">Scheduled</Badge>
                            )}
                            {f.ai_assessment?.trend && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                {trendIcon(f.ai_assessment.trend)} {f.ai_assessment.trend}
                              </span>
                            )}
                          </div>

                          {f.ai_summary && (
                            <p className="text-sm text-foreground mt-2">{f.ai_summary}</p>
                          )}

                          {f.ai_assessment?.recoveryPercent != null && (
                            <div className="mt-2 max-w-xs">
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Recovery</span>
                                <span>{f.ai_assessment.recoveryPercent}%</span>
                              </div>
                              <Progress value={f.ai_assessment.recoveryPercent} className="h-1.5" />
                            </div>
                          )}

                          {f.ai_assessment?.nextActions?.length > 0 && (
                            <ul className="mt-2 text-xs text-foreground space-y-0.5">
                              {f.ai_assessment.nextActions.slice(0, 3).map((a: any, i: number) => (
                                <li key={i}>
                                  • <span className="font-medium">{a.action}</span>{" "}
                                  <span className="text-muted-foreground">({a.timing})</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {f.ai_assessment?.encouragement && (
                            <p className="text-xs text-success mt-2 italic">
                              💚 {f.ai_assessment.encouragement}
                            </p>
                          )}

                          {f.notes && (
                            <p className="text-xs text-muted-foreground mt-2">📝 {f.notes}</p>
                          )}
                        </div>

                        {f.photo_url && (
                          <img
                            src={f.photo_url}
                            alt="Follow-up"
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                      </div>

                      <div className="flex justify-end gap-2 mt-3">
                        {f.status !== "completed" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setCheckInOpen(f);
                              setCheckInPhoto(null);
                              setCheckInNotes("");
                              setCheckInRating("about_same");
                            }}
                          >
                            <Camera className="w-4 h-4 mr-1" /> Do check-in
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => deleteFollowup(f.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      <Dialog open={!!checkInOpen} onOpenChange={(o) => !o && setCheckInOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Progress check-in</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Re-upload a photo of the same plant</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onPickFile}
                className="hidden"
              />
              {checkInPhoto ? (
                <img src={checkInPhoto} alt="" className="w-full h-44 rounded-lg object-cover mt-1" />
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-1 w-full border-2 border-dashed border-border rounded-lg py-8 flex flex-col items-center text-muted-foreground hover:border-primary/40"
                >
                  <Camera className="w-6 h-6 mb-1" /> Tap to take/upload photo
                </button>
              )}
              {checkInPhoto && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-xs text-primary mt-1"
                >
                  Replace photo
                </button>
              )}
            </div>

            <div>
              <Label className="text-xs">How does it look to you?</Label>
              <Select value={checkInRating} onValueChange={setCheckInRating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="much_better">Much better</SelectItem>
                  <SelectItem value="slightly_better">Slightly better</SelectItem>
                  <SelectItem value="about_same">About the same</SelectItem>
                  <SelectItem value="worse">Worse</SelectItem>
                  <SelectItem value="resolved">Looks fully recovered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea
                rows={3}
                placeholder="What treatments did you apply? Any new symptoms?"
                value={checkInNotes}
                onChange={(e) => setCheckInNotes(e.target.value)}
              />
            </div>

            <Button onClick={submitCheckIn} disabled={submittingCheckIn} className="w-full">
              {submittingCheckIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing progress…
                </>
              ) : (
                "Save check-in & analyze"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
