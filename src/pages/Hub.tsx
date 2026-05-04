import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Cloud, Sun, Droplets, Calendar, ShoppingCart, Users, MessageCircle, Sprout,
  Camera, TestTubes, FlaskConical, Loader2, AlertTriangle, ArrowRight, Heart,
  Sparkles, Volume2, VolumeX, RefreshCw, Bell,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getWeatherData, getDailyPlan } from "@/lib/ai-service";
import type { WeatherData, DailyPlan } from "@/lib/ai-service";
import { useDashboardTranslations } from "@/hooks/useDashboardTranslations";
import { LanguageSelector } from "@/components/dashboard/LanguageSelector";
import { useLanguage } from "@/hooks/useLanguage";
import { cachedFetch } from "@/lib/ai-cache";
import { speak, stopSpeaking, isSpeaking, languageToBcp47 } from "@/lib/voice";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface FarmEvent { id: string; title: string; event_date: string; priority: string; is_completed: boolean; crop: string | null; }
interface Listing { id: string; title: string; crop_type: string; price_per_unit: number; unit: string; }
interface Post { id: string; title: string; author_name: string; category: string; like_count: number; created_at: string; }
interface Group { id: string; name: string; primary_crop: string | null; member_count: number; }
interface Profile { primary_crop?: string | null; soil_type?: string | null; farm_size?: string | null; location?: string | null; }

const PRIORITY_DOT = (p: string) =>
  p === "high" ? "bg-destructive" : p === "medium" ? "bg-warning" : "bg-success";

export default function Hub() {
  const navigate = useNavigate();
  const { copy } = useDashboardTranslations();
  const { selectedLanguage, selectedCountry } = useLanguage();
  const { user } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [tasks, setTasks] = useState<FarmEvent[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planStale, setPlanStale] = useState(false);
  const [speakingPlan, setSpeakingPlan] = useState(false);

  const location = profile?.location || selectedCountry || "Port Moresby";

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, []);
  useEffect(() => () => stopSpeaking(), []);

  const load = async () => {
    setWeatherLoading(true);
    try {
      const w = await getWeatherData(location);
      setWeather(w);
    } catch { /* offline */ }
    setWeatherLoading(false);

    const today = new Date().toISOString().split("T")[0];
    const [{ data: e }, { data: l }, { data: p }, { data: g }, profileRes] = await Promise.all([
      supabase.from("farm_events").select("*").gte("event_date", today).eq("is_completed", false).order("event_date").limit(4),
      supabase.from("marketplace_listings").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(4),
      supabase.from("community_posts").select("*").order("created_at", { ascending: false }).limit(3),
      supabase.from("cooperative_groups").select("*").order("member_count", { ascending: false }).limit(3),
      user ? supabase.from("profiles").select("primary_crop,soil_type,farm_size,location").eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    if (e) setTasks(e as FarmEvent[]);
    if (l) setListings(l as Listing[]);
    if (p) setPosts(p as Post[]);
    if (g) setGroups(g as Group[]);
    if (profileRes && "data" in profileRes && profileRes.data) setProfile(profileRes.data as Profile);
  };

  // Build personalized daily plan after weather + tasks load
  useEffect(() => {
    if (!weather && tasks.length === 0) return;
    void buildPlan(false);
    // eslint-disable-next-line
  }, [weather?.location, tasks.length, profile?.primary_crop, selectedLanguage]);

  const planParams = useMemo(() => ({
    language: selectedLanguage,
    country: selectedCountry,
    location,
    primaryCrop: profile?.primary_crop ?? undefined,
    soilType: profile?.soil_type ?? undefined,
    farmSize: profile?.farm_size ?? undefined,
    weather: weather ? {
      temp: weather.current.temp,
      condition: weather.current.condition,
      humidity: weather.current.humidity,
      rainChanceToday: weather.forecast?.[0]?.rainChance,
      rainChanceTomorrow: weather.forecast?.[1]?.rainChance,
    } : undefined,
    upcomingTasks: tasks.slice(0, 5).map(t => ({
      title: t.title, date: t.event_date, priority: t.priority, crop: t.crop,
    })),
  }), [selectedLanguage, selectedCountry, location, profile, weather, tasks]);

  const buildPlan = async (force: boolean) => {
    setPlanLoading(true);
    try {
      const { value, stale } = await cachedFetch(
        "daily-plan",
        planParams,
        () => getDailyPlan(planParams),
        { ttl: 1000 * 60 * 60 * 6, force }, // 6h
      );
      setPlan(value);
      setPlanStale(stale);
    } catch (err) {
      toast({
        title: "Could not build daily plan",
        description: err instanceof Error ? err.message : "Try again later",
        variant: "destructive",
      });
    } finally {
      setPlanLoading(false);
    }
  };

  const togglePlanVoice = () => {
    if (speakingPlan || isSpeaking()) {
      stopSpeaking();
      setSpeakingPlan(false);
      return;
    }
    if (!plan) return;
    const lines = [
      plan.greeting,
      plan.summary,
      ...plan.actions.map((a, i) => `${i + 1}. ${a.title}. ${a.detail}`),
    ].join(". ");
    setSpeakingPlan(true);
    speak(lines, {
      lang: languageToBcp47(selectedLanguage),
      onEnd: () => setSpeakingPlan(false),
    });
  };

  // Aggregate alerts: weather-driven + AI-driven + overdue tasks
  const alerts = useMemo(() => {
    const out: Array<{ type: "warning" | "info" | "success"; title: string; message: string }> = [];
    if (weather?.farmingAlerts) out.push(...weather.farmingAlerts.slice(0, 2));
    if (plan?.alerts) out.push(...plan.alerts.slice(0, 2));
    const todayStr = new Date().toISOString().split("T")[0];
    const overdueHigh = tasks.find(t => t.priority === "high" && t.event_date <= todayStr);
    if (overdueHigh) out.push({
      type: "warning", title: "High-priority task today",
      message: overdueHigh.title,
    });
    return out.slice(0, 3);
  }, [weather, plan, tasks]);

  const tools = [
    { icon: Sprout, label: copy.dashboard.quickActions.cropAdvisor.label, path: "/dashboard/crops", color: "bg-success/10 text-success" },
    { icon: TestTubes, label: copy.dashboard.quickActions.soilAnalysis.label, path: "/dashboard/soil", color: "bg-warning/10 text-warning" },
    { icon: Camera, label: copy.dashboard.quickActions.diseaseScanner.label, path: "/dashboard/disease", color: "bg-destructive/10 text-destructive" },
    { icon: Droplets, label: copy.dashboard.quickActions.irrigation.label, path: "/dashboard/irrigation", color: "bg-accent/10 text-accent" },
    { icon: FlaskConical, label: copy.dashboard.quickActions.fertilizer.label, path: "/dashboard/fertilizer", color: "bg-warning/10 text-warning" },
    { icon: MessageCircle, label: copy.dashboard.quickActions.aiAssistant.label, path: "/dashboard/assistant", color: "bg-primary/10 text-primary" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header title="Farming Hub" subtitle="Your AI-powered farm command center" />
        <main className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">

          {/* Alerts strip */}
          {alerts.length > 0 && (
            <section className="space-y-2">
              {alerts.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                    a.type === "warning" ? "border-warning/40 bg-warning/10 text-foreground"
                    : a.type === "success" ? "border-success/40 bg-success/10 text-foreground"
                    : "border-accent/40 bg-accent/10 text-foreground"
                  }`}
                >
                  <Bell className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="opacity-80">{a.message}</p>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Hero: Weather + language */}
          <section className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-gradient-to-br from-accent to-accent/80 rounded-xl p-5 text-accent-foreground">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-lg flex items-center gap-2"><Cloud className="w-5 h-5" /> Today on the farm</h2>
                <Button variant="secondary" size="sm" onClick={() => navigate("/dashboard/weather")}>
                  Forecast <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              {weatherLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : weather ? (
                <div className="flex items-center gap-4">
                  <Sun className="w-14 h-14" />
                  <div>
                    <p className="text-3xl font-bold">{weather.current.temp}°C</p>
                    <p className="text-sm opacity-80">{weather.current.condition} · {weather.location}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs opacity-70">Humidity</p>
                    <p className="font-semibold">{weather.current.humidity}%</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm opacity-80">Weather unavailable offline</p>
              )}
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold mb-3">Language</h3>
              <LanguageSelector />
            </div>
          </section>

          {/* AI Daily Plan */}
          <section className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2 text-foreground">
                <Sparkles className="w-5 h-5 text-primary" /> Your AI plan for today
                {planStale && <span className="text-xs text-muted-foreground font-normal">(offline cache)</span>}
              </h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={togglePlanVoice} disabled={!plan}>
                  {speakingPlan ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => buildPlan(true)} disabled={planLoading}>
                  <RefreshCw className={`w-4 h-4 ${planLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {planLoading && !plan ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                <Loader2 className="w-4 h-4 animate-spin" /> Building your personalized plan…
              </div>
            ) : plan ? (
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-foreground">{plan.greeting}</p>
                  <p className="text-sm text-muted-foreground mt-1">{plan.summary}</p>
                </div>
                <ul className="space-y-2">
                  {plan.actions.map((a, i) => (
                    <li key={i} className="flex gap-3 p-3 rounded-lg bg-muted/40">
                      <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT(a.priority)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm text-foreground">{a.title}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{a.timing}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{a.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-6 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> No plan yet. Tap refresh to generate.
              </div>
            )}
          </section>

          {/* AI Tools grid */}
          <section>
            <h2 className="font-semibold text-foreground mb-3">AI Tools</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {tools.map((t) => (
                <button
                  key={t.path}
                  onClick={() => navigate(t.path)}
                  className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors text-left"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${t.color}`}>
                    <t.icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{t.label}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Tasks + Marketplace */}
          <section className="grid lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Upcoming tasks</h3>
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/calendar")}>Open</Button>
              </div>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No upcoming tasks</p>
              ) : (
                <ul className="space-y-2">
                  {tasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
                      <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT(t.priority)}`} />
                      <span className="flex-1 text-sm truncate">{t.title}</span>
                      <span className="text-xs text-muted-foreground">{new Date(t.event_date).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-secondary" /> Marketplace</h3>
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/marketplace")}>Open</Button>
              </div>
              {listings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No active listings</p>
              ) : (
                <ul className="space-y-2">
                  {listings.map((l) => (
                    <li key={l.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                      <span className="text-sm truncate">{l.title}</span>
                      <span className="text-xs font-medium text-foreground">{l.price_per_unit}/{l.unit}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Community + Coops */}
          <section className="grid lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2"><MessageCircle className="w-5 h-5 text-accent" /> Community</h3>
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/community")}>Open</Button>
              </div>
              {posts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No posts yet</p>
              ) : (
                <ul className="space-y-2">
                  {posts.map((p) => (
                    <li key={p.id} className="p-2 rounded-lg bg-muted/40">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{p.author_name}</span>
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{p.like_count}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Cooperatives</h3>
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/cooperatives")}>Open</Button>
              </div>
              {groups.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No groups yet</p>
              ) : (
                <ul className="space-y-2">
                  {groups.map((g) => (
                    <li key={g.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                      <span className="text-sm truncate">{g.name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" /> {g.member_count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
