import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Cloud, Sun, Droplets, Calendar, ShoppingCart, Users, MessageCircle, Sprout,
  Camera, TestTubes, FlaskConical, Loader2, AlertTriangle, ArrowRight, Heart,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getWeatherData } from "@/lib/ai-service";
import type { WeatherData } from "@/lib/ai-service";
import { useDashboardTranslations } from "@/hooks/useDashboardTranslations";
import { LanguageSelector } from "@/components/dashboard/LanguageSelector";

interface FarmEvent { id: string; title: string; event_date: string; priority: string; is_completed: boolean; crop: string | null; }
interface Listing { id: string; title: string; crop_type: string; price_per_unit: number; unit: string; }
interface Post { id: string; title: string; author_name: string; category: string; like_count: number; created_at: string; }
interface Group { id: string; name: string; primary_crop: string | null; member_count: number; }

export default function Hub() {
  const navigate = useNavigate();
  const { copy } = useDashboardTranslations();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [tasks, setTasks] = useState<FarmEvent[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setWeatherLoading(true);
    try {
      const w = await getWeatherData("Port Moresby");
      setWeather(w);
    } catch { /* offline */ }
    setWeatherLoading(false);

    const today = new Date().toISOString().split("T")[0];
    const [{ data: e }, { data: l }, { data: p }, { data: g }] = await Promise.all([
      supabase.from("farm_events").select("*").gte("event_date", today).eq("is_completed", false).order("event_date").limit(4),
      supabase.from("marketplace_listings").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(4),
      supabase.from("community_posts").select("*").order("created_at", { ascending: false }).limit(3),
      supabase.from("cooperative_groups").select("*").order("member_count", { ascending: false }).limit(3),
    ]);
    if (e) setTasks(e as FarmEvent[]);
    if (l) setListings(l as Listing[]);
    if (p) setPosts(p as Post[]);
    if (g) setGroups(g as Group[]);
  };

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
        <Header title="Farming Hub" subtitle="Everything for your farm in one place" />
        <main className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
          {/* Hero: Weather + language + alerts */}
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
              {weather?.farmingAlerts && weather.farmingAlerts.length > 0 && (
                <div className="mt-4 p-3 bg-background/20 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">{weather.farmingAlerts[0].title}</p>
                    <p className="opacity-80">{weather.farmingAlerts[0].message}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold mb-3">Language</h3>
              <LanguageSelector />
            </div>
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
                      <span className={`w-2 h-2 rounded-full ${t.priority === "high" ? "bg-destructive" : t.priority === "medium" ? "bg-warning" : "bg-success"}`} />
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
