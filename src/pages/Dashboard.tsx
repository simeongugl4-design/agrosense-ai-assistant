import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  Sprout, Cloud, Droplets, TrendingUp, AlertTriangle,
  Sun, Wind, Thermometer, Calendar, ShoppingCart, Loader2,
  TestTubes, Camera, MessageCircle, Leaf, CheckCircle2,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getWeatherData } from "@/lib/ai-service";
import type { WeatherData } from "@/lib/ai-service";
import { LanguageSelector } from "@/components/dashboard/LanguageSelector";
import { useLanguage } from "@/hooks/useLanguage";
import { useDashboardTranslations } from "@/hooks/useDashboardTranslations";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

interface FarmEvent {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  priority: string;
  is_completed: boolean;
  crop: string | null;
}

interface Listing {
  id: string;
  title: string;
  crop_type: string;
  price_per_unit: number;
  unit: string;
  listing_type: string;
  status: string;
  created_at: string;
  location: string | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedCountry, selectedLanguage } = useLanguage();
  const { copy } = useDashboardTranslations();
  const [listingsCount, setListingsCount] = useState({ active: 0, sell: 0, buy: 0 });
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<FarmEvent[]>([]);
  const [eventStats, setEventStats] = useState({ total: 0, completed: 0, upcoming: 0, overdue: 0 });
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    void fetchListings();
    void fetchWeather("Nairobi");
    if (user) void fetchUpcomingEvents();
  }, [user]);

  const fetchListings = async () => {
    const { data } = await supabase.from("marketplace_listings").select("*").order("created_at", { ascending: false }).limit(50);
    if (data) {
      const listings = data as Listing[];
      setListingsCount({
        active: listings.filter((l) => l.status === "active").length,
        sell: listings.filter((l) => l.listing_type === "sell" && l.status === "active").length,
        buy: listings.filter((l) => l.listing_type === "buy" && l.status === "active").length,
      });
      setRecentListings(listings.filter((l) => l.status === "active").slice(0, 4));
    }
  };

  const fetchUpcomingEvents = async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("farm_events")
      .select("*")
      .order("event_date", { ascending: true });
    if (data) {
      const events = data as FarmEvent[];
      const upcoming = events.filter((e) => !e.is_completed && e.event_date >= todayStr).slice(0, 5);
      const overdue = events.filter((e) => !e.is_completed && e.event_date < todayStr).length;
      setUpcomingEvents(upcoming);
      setEventStats({
        total: events.length,
        completed: events.filter((e) => e.is_completed).length,
        upcoming: events.filter((e) => !e.is_completed && e.event_date >= todayStr).length,
        overdue,
      });
    }
  };

  const fetchWeather = async (location: string) => {
    setWeatherLoading(true);
    try {
      const data = await getWeatherData(location);
      setWeather(data);
    } catch (error) {
      console.error("Weather fetch error:", error);
    } finally {
      setWeatherLoading(false);
    }
  };

  const eventChartData = [
    { name: "✅", value: eventStats.completed, fill: "hsl(var(--success))" },
    { name: "📅", value: eventStats.upcoming, fill: "hsl(var(--warning))" },
    { name: "⚠️", value: eventStats.overdue, fill: "hsl(var(--destructive))" },
  ].filter((d) => d.value > 0);

  const forecastChartData = weather?.forecast?.slice(0, 7).map((day) => ({
    day: day.day.slice(0, 3),
    high: day.high,
    low: day.low,
    rain: day.rainChance,
  })) || [];

  const COLORS = ["hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];

  const quickActions = [
    { icon: Sprout, label: copy.dashboard.quickActions.cropAdvisor.label, color: "bg-success/10 text-success", path: "/dashboard/crops", desc: copy.dashboard.quickActions.cropAdvisor.desc },
    { icon: Cloud, label: copy.dashboard.quickActions.weather.label, color: "bg-accent/10 text-accent", path: "/dashboard/weather", desc: copy.dashboard.quickActions.weather.desc },
    { icon: TestTubes, label: copy.dashboard.quickActions.soilAnalysis.label, color: "bg-warning/10 text-warning", path: "/dashboard/soil", desc: copy.dashboard.quickActions.soilAnalysis.desc },
    { icon: Camera, label: copy.dashboard.quickActions.diseaseScanner.label, color: "bg-destructive/10 text-destructive", path: "/dashboard/disease", desc: copy.dashboard.quickActions.diseaseScanner.desc },
    { icon: Droplets, label: copy.dashboard.quickActions.irrigation.label, color: "bg-accent/10 text-accent", path: "/dashboard/irrigation", desc: copy.dashboard.quickActions.irrigation.desc },
    { icon: Thermometer, label: copy.dashboard.quickActions.fertilizer.label, color: "bg-warning/10 text-warning", path: "/dashboard/fertilizer", desc: copy.dashboard.quickActions.fertilizer.desc },
    { icon: Calendar, label: copy.dashboard.quickActions.farmCalendar.label, color: "bg-primary/10 text-primary", path: "/dashboard/calendar", desc: copy.dashboard.quickActions.farmCalendar.desc },
    { icon: ShoppingCart, label: copy.dashboard.quickActions.marketplace.label, color: "bg-secondary/10 text-secondary", path: "/dashboard/marketplace", desc: copy.dashboard.quickActions.marketplace.desc },
    { icon: MessageCircle, label: copy.dashboard.quickActions.aiAssistant.label, color: "bg-primary/10 text-primary", path: "/dashboard/assistant", desc: copy.dashboard.quickActions.aiAssistant.desc },
  ];

  const getPriorityColor = (p: string) => {
    if (p === "high") return "text-destructive";
    if (p === "medium") return "text-warning";
    return "text-success";
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header title={copy.dashboard.title} subtitle={copy.dashboard.subtitle} />

        <main className="p-4 lg:p-6">
          <div className="mb-6 p-4 bg-card rounded-xl border border-border flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{copy.dashboard.bannerTitle}</p>
              <p className="text-xs text-muted-foreground">{copy.dashboard.bannerSubtitle}</p>
            </div>
            <LanguageSelector />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <StatCard
              title={copy.dashboard.stats.marketplace}
              value={listingsCount.active.toString()}
              change={copy.dashboard.stats.activeListings}
              changeType="positive"
              icon={TrendingUp}
              iconColor="text-secondary"
              iconBg="bg-secondary/10"
            />
            <StatCard
              title={copy.dashboard.stats.weather}
              value={weather ? `${weather.current.temp}°C` : "—"}
              change={weather?.location || copy.dashboard.stats.searchLocation}
              changeType="positive"
              icon={Cloud}
              iconColor="text-accent"
              iconBg="bg-accent/10"
            />
            <StatCard
              title={copy.dashboard.stats.language}
              value={selectedLanguage || "English"}
              change={selectedCountry || copy.common.notSet}
              changeType="positive"
              icon={Leaf}
              iconColor="text-primary"
              iconBg="bg-primary/10"
            />
            <StatCard
              title={copy.dashboard.stats.aiFeatures}
              value="9"
              change={copy.dashboard.stats.allActive}
              changeType="positive"
              icon={Sprout}
              iconColor="text-success"
              iconBg="bg-success/10"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
            {/* Weather Card */}
            <div className="lg:col-span-1 bg-gradient-to-br from-accent to-accent/80 rounded-xl p-5 lg:p-6 text-accent-foreground">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{copy.dashboard.weatherCard.title}</h3>
                <Cloud className="w-6 h-6" />
              </div>
              {weatherLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
              ) : weather ? (
                <>
                  <p className="text-xs opacity-70 mb-3">{weather.location}</p>
                  <div className="flex items-center gap-4 mb-6">
                    <Sun className="w-14 h-14 lg:w-16 lg:h-16" />
                    <div>
                      <p className="text-4xl font-bold">{weather.current.temp}°C</p>
                      <p className="opacity-80 text-sm">{weather.current.condition}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <Droplets className="w-4 h-4 mx-auto mb-1 opacity-80" />
                      <p className="text-sm font-medium">{weather.current.humidity}%</p>
                      <p className="text-xs opacity-60">{copy.dashboard.weatherCard.humidity}</p>
                    </div>
                    <div className="text-center">
                      <Wind className="w-4 h-4 mx-auto mb-1 opacity-80" />
                      <p className="text-sm font-medium">{weather.current.windSpeed} km/h</p>
                      <p className="text-xs opacity-60">{copy.dashboard.weatherCard.wind}</p>
                    </div>
                    <div className="text-center">
                      <Thermometer className="w-4 h-4 mx-auto mb-1 opacity-80" />
                      <p className="text-sm font-medium">{weather.current.feelsLike}°C</p>
                      <p className="text-xs opacity-60">{copy.dashboard.weatherCard.feelsLike}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6"><p className="opacity-80 text-sm">{copy.dashboard.weatherCard.loading}</p></div>
              )}
              <Button variant="secondary" className="w-full mt-4" onClick={() => navigate("/dashboard/weather")}>
                {copy.dashboard.weatherCard.viewForecast}
              </Button>
            </div>

            {/* Farming Alerts */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-foreground">{copy.dashboard.recommendations.title}</h3>
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div className="space-y-3">
                {weather?.farmingAlerts && weather.farmingAlerts.length > 0 ? (
                  weather.farmingAlerts.slice(0, 3).map((alert, index) => (
                    <div key={index} className={cn("p-3 lg:p-4 rounded-lg border", alert.type === "warning" ? "bg-warning/10 border-warning/30" : alert.type === "success" ? "bg-success/10 border-success/30" : "bg-accent/10 border-accent/30")}>
                      <h4 className="font-medium text-foreground text-sm">{alert.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="p-3 lg:p-4 rounded-lg border bg-accent/10 border-accent/30"><p className="text-foreground text-sm">{copy.dashboard.recommendations.soil}</p></div>
                    <div className="p-3 lg:p-4 rounded-lg border bg-success/10 border-success/30"><p className="text-foreground text-sm">{copy.dashboard.recommendations.disease}</p></div>
                    <div className="p-3 lg:p-4 rounded-lg border bg-warning/10 border-warning/30"><p className="text-foreground text-sm">{copy.dashboard.recommendations.assistant}</p></div>
                  </>
                )}
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/dashboard/assistant")}>
                {copy.dashboard.recommendations.chatButton}
              </Button>
            </div>
          </div>

          {/* New: Charts and Activity Row */}
          <div className="grid lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
            {/* 7-Day Forecast Chart */}
            {forecastChartData.length > 0 && (
              <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent" />
                  7-Day Temperature Forecast
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={forecastChartData} barGap={2}>
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Bar dataKey="high" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="High °C" />
                    <Bar dataKey="low" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Low °C" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Farm Activity Pie Chart */}
            {eventChartData.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Farm Activity
                </h3>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={eventChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                        {eventChartData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2 text-xs">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" />Done: {eventStats.completed}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" />Upcoming: {eventStats.upcoming}</span>
                  {eventStats.overdue > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" />Overdue: {eventStats.overdue}</span>}
                </div>
              </div>
            )}
          </div>

          {/* New: Upcoming Events & Recent Listings */}
          <div className="grid lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
            {/* Upcoming Farm Events */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Upcoming Tasks
                </h3>
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/calendar")}>View All</Button>
              </div>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                      <div className={`w-2 h-2 rounded-full ${event.priority === "high" ? "bg-destructive" : event.priority === "medium" ? "bg-warning" : "bg-success"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(event.event_date).toLocaleDateString()} {event.crop && `• ${event.crop}`}</p>
                      </div>
                      <span className={`text-xs font-medium ${getPriorityColor(event.priority)}`}>{event.priority}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No upcoming tasks</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate("/dashboard/calendar")}>Add Task</Button>
                </div>
              )}
            </div>

            {/* Recent Marketplace Listings */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-secondary" />
                  Recent Listings
                </h3>
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/marketplace")}>View All</Button>
              </div>
              {recentListings.length > 0 ? (
                <div className="space-y-3">
                  {recentListings.map((listing) => (
                    <div key={listing.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate("/dashboard/marketplace")}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${listing.listing_type === "sell" ? "bg-success/10" : "bg-accent/10"}`}>
                        {listing.listing_type === "sell" ? <TrendingUp className="w-5 h-5 text-success" /> : <ShoppingCart className="w-5 h-5 text-accent" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{listing.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{listing.crop_type} {listing.location && `• ${listing.location}`}</p>
                      </div>
                      <span className="text-sm font-bold text-success">{listing.price_per_unit}/{listing.unit}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No active listings</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate("/dashboard/marketplace")}>Browse</Button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="font-semibold text-lg text-foreground mb-4">{copy.dashboard.quickActionsTitle}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center gap-2 p-4 lg:p-5 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all group"
                >
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-5 h-5 lg:w-6 lg:h-6" />
                  </div>
                  <span className="text-xs lg:text-sm font-medium text-foreground text-center">{action.label}</span>
                  <span className="text-[10px] text-muted-foreground text-center">{action.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
