import { useState, useEffect } from "react";
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

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedCountry, selectedLanguage } = useLanguage();
  const [listingsCount, setListingsCount] = useState({ active: 0 });
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    fetchListings();
    // Try to get weather for a default location
    fetchWeather("Nairobi");
  }, []);

  const fetchListings = async () => {
    const { data } = await supabase.from("marketplace_listings").select("id, status");
    if (data) {
      setListingsCount({ active: data.filter(l => l.status === "active").length });
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
    { icon: Sprout, label: "Crop Advisor", color: "bg-success/10 text-success", path: "/dashboard/crops", desc: "Get crop recommendations" },
    { icon: Cloud, label: "Weather", color: "bg-accent/10 text-accent", path: "/dashboard/weather", desc: "Real-time forecasts" },
    { icon: TestTubes, label: "Soil Analysis", color: "bg-warning/10 text-warning", path: "/dashboard/soil", desc: "Photo-based testing" },
    { icon: Camera, label: "Disease Scanner", color: "bg-destructive/10 text-destructive", path: "/dashboard/disease", desc: "Leaf & disease detection" },
    { icon: Droplets, label: "Irrigation", color: "bg-accent/10 text-accent", path: "/dashboard/irrigation", desc: "Smart water management" },
    { icon: Thermometer, label: "Fertilizer", color: "bg-warning/10 text-warning", path: "/dashboard/fertilizer", desc: "Nutrient planning" },
    { icon: Calendar, label: "Farm Calendar", color: "bg-primary/10 text-primary", path: "/dashboard/calendar", desc: "Schedule activities" },
    { icon: ShoppingCart, label: "Marketplace", color: "bg-secondary/10 text-secondary", path: "/dashboard/marketplace", desc: "Buy & sell produce" },
    { icon: MessageCircle, label: "AI Assistant", color: "bg-primary/10 text-primary", path: "/dashboard/assistant", desc: "Ask anything" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header title="Dashboard" subtitle="Welcome! Here's your agricultural command center." />
        
        <main className="p-4 lg:p-6">
          {/* Language Selector Banner */}
          <div className="mb-6 p-4 bg-card rounded-xl border border-border flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">🌍 Set your country & language</p>
              <p className="text-xs text-muted-foreground">All AI features will respond in your selected language</p>
            </div>
            <LanguageSelector />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <StatCard
              title="Marketplace"
              value={listingsCount.active.toString()}
              change="Active listings"
              changeType="positive"
              icon={TrendingUp}
              iconColor="text-secondary"
              iconBg="bg-secondary/10"
            />
            <StatCard
              title="Weather"
              value={weather ? `${weather.current.temp}°C` : "—"}
              change={weather?.location || "Search a location"}
              changeType="positive"
              icon={Cloud}
              iconColor="text-accent"
              iconBg="bg-accent/10"
            />
            <StatCard
              title="Language"
              value={selectedLanguage || "English"}
              change={selectedCountry || "Not set"}
              changeType="positive"
              icon={Leaf}
              iconColor="text-primary"
              iconBg="bg-primary/10"
            />
            <StatCard
              title="AI Features"
              value="9"
              change="All active"
              changeType="positive"
              icon={Sprout}
              iconColor="text-success"
              iconBg="bg-success/10"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Weather Widget */}
            <div className="lg:col-span-1 bg-gradient-to-br from-accent to-accent/80 rounded-xl p-5 lg:p-6 text-accent-foreground">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Today's Weather</h3>
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
                      <p className="text-xs opacity-60">Humidity</p>
                    </div>
                    <div className="text-center">
                      <Wind className="w-4 h-4 mx-auto mb-1 opacity-80" />
                      <p className="text-sm font-medium">{weather.current.windSpeed} km/h</p>
                      <p className="text-xs opacity-60">Wind</p>
                    </div>
                    <div className="text-center">
                      <Thermometer className="w-4 h-4 mx-auto mb-1 opacity-80" />
                      <p className="text-sm font-medium">{weather.current.feelsLike}°C</p>
                      <p className="text-xs opacity-60">Feels Like</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="opacity-80 text-sm">Loading weather...</p>
                </div>
              )}
              <Button variant="secondary" className="w-full mt-4" onClick={() => navigate("/dashboard/weather")}>
                View Full Forecast
              </Button>
            </div>

            {/* AI Alerts */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-foreground">AI Recommendations</h3>
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div className="space-y-3">
                {weather?.farmingAlerts && weather.farmingAlerts.length > 0 ? (
                  weather.farmingAlerts.slice(0, 3).map((alert, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-3 lg:p-4 rounded-lg border",
                        alert.type === "warning" ? "bg-warning/10 border-warning/30" 
                          : alert.type === "success" ? "bg-success/10 border-success/30"
                          : "bg-accent/10 border-accent/30"
                      )}
                    >
                      <h4 className="font-medium text-foreground text-sm">{alert.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="p-3 lg:p-4 rounded-lg border bg-accent/10 border-accent/30">
                      <p className="text-foreground text-sm">🧪 <strong>Soil Analysis</strong> — Upload a soil photo to get nutrient levels and crop recommendations.</p>
                    </div>
                    <div className="p-3 lg:p-4 rounded-lg border bg-success/10 border-success/30">
                      <p className="text-foreground text-sm">🍃 <strong>Disease Scanner</strong> — Take a photo of any crop leaf to identify diseases and get treatment plans.</p>
                    </div>
                    <div className="p-3 lg:p-4 rounded-lg border bg-warning/10 border-warning/30">
                      <p className="text-foreground text-sm">🤖 <strong>AI Assistant</strong> — Ask any farming question in your own language and get expert advice.</p>
                    </div>
                  </>
                )}
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/dashboard/assistant")}>
                Chat with AI Assistant
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 lg:mt-8">
            <h3 className="font-semibold text-lg text-foreground mb-4">Quick Actions</h3>
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