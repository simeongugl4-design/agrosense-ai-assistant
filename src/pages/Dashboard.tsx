import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { 
  Sprout, 
  Cloud, 
  Droplets, 
  TrendingUp, 
  AlertTriangle,
  Sun,
  Wind,
  Thermometer,
  Calendar,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getWeatherData } from "@/lib/ai-service";
import type { WeatherData } from "@/lib/ai-service";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [eventsCount, setEventsCount] = useState({ total: 0, upcoming: 0, urgent: 0, completed: 0 });
  const [listingsCount, setListingsCount] = useState({ active: 0, myListings: 0 });
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [profileLocation, setProfileLocation] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    // Fetch profile, events, and listings in parallel
    const [profileRes, eventsRes, listingsRes] = await Promise.all([
      supabase.from("profiles").select("location, farm_size, primary_crop").eq("user_id", user.id).maybeSingle(),
      supabase.from("farm_events").select("id, event_date, is_completed, priority"),
      supabase.from("marketplace_listings").select("id, user_id, status"),
    ]);

    // Profile location for weather
    if (profileRes.data?.location) {
      setProfileLocation(profileRes.data.location);
      fetchWeather(profileRes.data.location);
    }

    // Events stats
    if (eventsRes.data) {
      const today = new Date().toISOString().split("T")[0];
      const threeDaysLater = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];
      setEventsCount({
        total: eventsRes.data.length,
        upcoming: eventsRes.data.filter(e => !e.is_completed && e.event_date >= today).length,
        urgent: eventsRes.data.filter(e => !e.is_completed && e.priority === "high" && e.event_date >= today && e.event_date <= threeDaysLater).length,
        completed: eventsRes.data.filter(e => e.is_completed).length,
      });
    }

    // Listings stats
    if (listingsRes.data) {
      setListingsCount({
        active: listingsRes.data.filter(l => l.status === "active").length,
        myListings: listingsRes.data.filter(l => l.user_id === user.id).length,
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

  const getWeatherIcon = (code: number) => {
    if (code <= 3) return Sun;
    if (code >= 51 && code <= 67) return Cloud;
    if (code >= 80) return Cloud;
    return Cloud;
  };

  const quickActions = [
    { icon: Sprout, label: "Crop Advisor", color: "bg-success/10 text-success", path: "/dashboard/crops" },
    { icon: Cloud, label: "Weather", color: "bg-accent/10 text-accent", path: "/dashboard/weather" },
    { icon: Droplets, label: "Irrigation", color: "bg-accent/10 text-accent", path: "/dashboard/irrigation" },
    { icon: Thermometer, label: "Fertilizer", color: "bg-warning/10 text-warning", path: "/dashboard/fertilizer" },
    { icon: Calendar, label: "Farm Calendar", color: "bg-primary/10 text-primary", path: "/dashboard/calendar" },
    { icon: ShoppingCart, label: "Marketplace", color: "bg-secondary/10 text-secondary", path: "/dashboard/marketplace" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header title="Dashboard" subtitle="Welcome back! Here's your farm overview." />
        
        <main className="p-4 lg:p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <StatCard
              title="Farm Events"
              value={eventsCount.total.toString()}
              change={`${eventsCount.upcoming} upcoming`}
              changeType="positive"
              icon={Calendar}
              iconColor="text-primary"
              iconBg="bg-primary/10"
            />
            <StatCard
              title="Urgent Tasks"
              value={eventsCount.urgent.toString()}
              change={eventsCount.urgent > 0 ? "Needs attention!" : "All on track"}
              changeType={eventsCount.urgent > 0 ? "negative" : "positive"}
              icon={AlertTriangle}
              iconColor={eventsCount.urgent > 0 ? "text-destructive" : "text-success"}
              iconBg={eventsCount.urgent > 0 ? "bg-destructive/10" : "bg-success/10"}
            />
            <StatCard
              title="Completed"
              value={eventsCount.completed.toString()}
              change="Tasks done"
              changeType="positive"
              icon={Sprout}
              iconColor="text-success"
              iconBg="bg-success/10"
            />
            <StatCard
              title="Marketplace"
              value={listingsCount.active.toString()}
              change={`${listingsCount.myListings} your listings`}
              changeType="positive"
              icon={TrendingUp}
              iconColor="text-secondary"
              iconBg="bg-secondary/10"
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
                  <p className="opacity-80 text-sm mb-3">
                    {profileLocation ? "Loading weather..." : "Set your location in Settings to see live weather"}
                  </p>
                </div>
              )}
              <Button 
                variant="secondary" 
                className="w-full mt-4"
                onClick={() => navigate("/dashboard/weather")}
              >
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
                        alert.type === "warning" 
                          ? "bg-warning/10 border-warning/30" 
                          : alert.type === "success"
                          ? "bg-success/10 border-success/30"
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
                      <p className="text-foreground text-sm">
                        {profileLocation 
                          ? "Loading AI recommendations based on your weather..."
                          : "Set your location in Settings to get AI farming recommendations based on real weather data."
                        }
                      </p>
                    </div>
                    <div className="p-3 lg:p-4 rounded-lg border bg-success/10 border-success/30">
                      <p className="text-foreground text-sm">
                        Use the Crop Advisor to get AI-powered crop recommendations based on your soil and location.
                      </p>
                    </div>
                  </>
                )}
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate("/dashboard/weather")}
              >
                View All Recommendations
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 lg:mt-8">
            <h3 className="font-semibold text-lg text-foreground mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center gap-2 lg:gap-3 p-4 lg:p-6 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl ${action.color} flex items-center justify-center`}>
                    <action.icon className="w-5 h-5 lg:w-6 lg:h-6" />
                  </div>
                  <span className="text-xs lg:text-sm font-medium text-foreground text-center">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
