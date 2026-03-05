import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  Sprout, Cloud, Droplets, TrendingUp, AlertTriangle,
  Sun, Wind, Thermometer, Calendar, ShoppingCart, Loader2,
  TestTubes, Camera, MessageCircle, Leaf,
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

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedCountry, selectedLanguage } = useLanguage();
  const { copy } = useDashboardTranslations();
  const [listingsCount, setListingsCount] = useState({ active: 0 });
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    void fetchListings();
    void fetchWeather("Nairobi");
  }, [user]);

  const fetchListings = async () => {
    const { data } = await supabase.from("marketplace_listings").select("id, status");
    if (data) {
      setListingsCount({ active: data.filter((l) => l.status === "active").length });
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

          <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="lg:col-span-1 bg-gradient-to-br from-accent to-accent/80 rounded-xl p-5 lg:p-6 text-accent-foreground">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{copy.dashboard.weatherCard.title}</h3>
                <Cloud className="w-6 h-6" />
              </div>

              {weatherLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
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
                <div className="text-center py-6">
                  <p className="opacity-80 text-sm">{copy.dashboard.weatherCard.loading}</p>
                </div>
              )}
              <Button variant="secondary" className="w-full mt-4" onClick={() => navigate("/dashboard/weather")}>
                {copy.dashboard.weatherCard.viewForecast}
              </Button>
            </div>

            <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-foreground">{copy.dashboard.recommendations.title}</h3>
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div className="space-y-3">
                {weather?.farmingAlerts && weather.farmingAlerts.length > 0 ? (
                  weather.farmingAlerts.slice(0, 3).map((alert, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-3 lg:p-4 rounded-lg border",
                        alert.type === "warning"
                          ? "bg-warning/10 border-warning/30"
                          : alert.type === "success"
                            ? "bg-success/10 border-success/30"
                            : "bg-accent/10 border-accent/30",
                      )}
                    >
                      <h4 className="font-medium text-foreground text-sm">{alert.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="p-3 lg:p-4 rounded-lg border bg-accent/10 border-accent/30">
                      <p className="text-foreground text-sm">{copy.dashboard.recommendations.soil}</p>
                    </div>
                    <div className="p-3 lg:p-4 rounded-lg border bg-success/10 border-success/30">
                      <p className="text-foreground text-sm">{copy.dashboard.recommendations.disease}</p>
                    </div>
                    <div className="p-3 lg:p-4 rounded-lg border bg-warning/10 border-warning/30">
                      <p className="text-foreground text-sm">{copy.dashboard.recommendations.assistant}</p>
                    </div>
                  </>
                )}
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/dashboard/assistant")}>
                {copy.dashboard.recommendations.chatButton}
              </Button>
            </div>
          </div>

          <div className="mt-6 lg:mt-8">
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
