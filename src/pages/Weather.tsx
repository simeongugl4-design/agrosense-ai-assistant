import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  Droplets, 
  Wind, 
  Thermometer,
  AlertTriangle,
  Calendar,
  Sprout,
  Loader2,
  Search,
  CloudSnow,
  CloudLightning,
  CloudFog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getWeatherData } from "@/lib/ai-service";
import type { WeatherData } from "@/lib/ai-service";
import { toast } from "@/hooks/use-toast";

function getWeatherIcon(code: number) {
  if (code === 0 || code === 1) return Sun;
  if (code === 2 || code === 3) return Cloud;
  if (code >= 45 && code <= 48) return CloudFog;
  if (code >= 51 && code <= 67) return CloudRain;
  if (code >= 71 && code <= 77) return CloudSnow;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code >= 95) return CloudLightning;
  return Cloud;
}

export default function Weather() {
  const [location, setLocation] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!location.trim()) {
      toast({ variant: "destructive", title: "Please enter a location" });
      return;
    }
    setIsLoading(true);
    try {
      const data = await getWeatherData(location.trim());
      setWeather(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Weather Fetch Failed",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header 
          title="Weather Intelligence" 
          subtitle="Real-time weather data with AI-powered farming insights" 
        />
        
        <main className="p-4 lg:p-6">
          {/* Search Bar */}
          <div className="flex gap-3 mb-6 lg:mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Enter your location (e.g., Ludhiana, Punjab)"
                className="pl-10"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get Weather"}
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-foreground font-medium">Fetching live weather data...</p>
              <p className="text-sm text-muted-foreground">Generating AI farming insights</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !weather && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Cloud className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-foreground font-medium mb-2">Enter your location to get started</p>
              <p className="text-sm text-muted-foreground max-w-md">
                Get real-time weather data, 7-day forecast, and AI-powered farming recommendations tailored to your area.
              </p>
            </div>
          )}

          {/* Weather Data */}
          {!isLoading && weather && (
            <>
              {/* Current Weather + Alerts */}
              <div className="grid lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
                <div className="lg:col-span-1 bg-gradient-to-br from-accent to-accent/80 rounded-xl p-5 lg:p-6 text-accent-foreground">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm opacity-80">Current Weather</p>
                      <p className="text-xs opacity-60">{weather.location}</p>
                    </div>
                    {(() => {
                      const Icon = getWeatherIcon(weather.current.weatherCode);
                      return <Icon className="w-8 h-8" />;
                    })()}
                  </div>
                  
                  <div className="flex items-center gap-4 mb-6">
                    {(() => {
                      const Icon = getWeatherIcon(weather.current.weatherCode);
                      return <Icon className="w-16 h-16 lg:w-20 lg:h-20" />;
                    })()}
                    <div>
                      <p className="text-4xl lg:text-5xl font-bold">{weather.current.temp}°C</p>
                      <p className="opacity-80">{weather.current.condition}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <Droplets className="w-5 h-5 mx-auto mb-1 opacity-80" />
                      <p className="text-sm font-medium">{weather.current.humidity}%</p>
                      <p className="text-xs opacity-60">Humidity</p>
                    </div>
                    <div className="text-center">
                      <Wind className="w-5 h-5 mx-auto mb-1 opacity-80" />
                      <p className="text-sm font-medium">{weather.current.windSpeed} km/h</p>
                      <p className="text-xs opacity-60">Wind</p>
                    </div>
                    <div className="text-center">
                      <Thermometer className="w-5 h-5 mx-auto mb-1 opacity-80" />
                      <p className="text-sm font-medium">{weather.current.feelsLike}°C</p>
                      <p className="text-xs opacity-60">Feels Like</p>
                    </div>
                  </div>
                </div>

                {/* Farming Alerts */}
                <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 lg:p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    AI Farming Alerts
                  </h3>
                  <div className="space-y-3">
                    {weather.farmingAlerts.length > 0 ? (
                      weather.farmingAlerts.map((alert, index) => (
                        <div
                          key={index}
                          className={`p-3 lg:p-4 rounded-lg border ${
                            alert.type === "warning"
                              ? "bg-warning/10 border-warning/30"
                              : alert.type === "success"
                              ? "bg-success/10 border-success/30"
                              : "bg-accent/10 border-accent/30"
                          }`}
                        >
                          <h4 className="font-medium text-foreground text-sm">{alert.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No specific alerts for your area today.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 7-Day Forecast */}
              <div className="bg-card rounded-xl border border-border p-5 lg:p-6 mb-6 lg:mb-8">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  7-Day Forecast
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3 lg:gap-4">
                  {weather.forecast.map((day, index) => {
                    const DayIcon = getWeatherIcon(day.weatherCode);
                    return (
                      <div
                        key={index}
                        className={`text-center p-3 lg:p-4 rounded-xl transition-all ${
                          index === 0
                            ? "bg-primary/10 border border-primary/30"
                            : "bg-muted/50 hover:bg-muted"
                        }`}
                      >
                        <p className={`text-xs lg:text-sm font-medium mb-2 ${index === 0 ? "text-primary" : "text-foreground"}`}>
                          {day.day}
                        </p>
                        <DayIcon className={`w-6 h-6 lg:w-8 lg:h-8 mx-auto mb-2 ${
                          day.condition.includes("Rain") || day.condition.includes("Drizzle") ? "text-accent" : "text-secondary"
                        }`} />
                        <p className="text-base lg:text-lg font-bold text-foreground">{day.high}°</p>
                        <p className="text-xs lg:text-sm text-muted-foreground">{day.low}°</p>
                        <div className="mt-2 flex items-center justify-center gap-1">
                          <Droplets className="w-3 h-3 text-accent" />
                          <span className="text-xs text-muted-foreground">{day.rainChance}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Farming Tips */}
              {weather.farmingTips.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-5 lg:p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-success" />
                    Smart Farming Recommendations
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                    {weather.farmingTips.map((tip, index) => (
                      <div
                        key={index}
                        className={`p-3 lg:p-4 rounded-xl border ${
                          tip.status === "urgent"
                            ? "bg-warning/10 border-warning/30"
                            : tip.status === "pause"
                            ? "bg-muted border-border"
                            : tip.status === "good"
                            ? "bg-success/10 border-success/30"
                            : "bg-accent/10 border-accent/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-foreground text-sm">{tip.activity}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            tip.status === "urgent"
                              ? "bg-warning text-warning-foreground"
                              : tip.status === "pause"
                              ? "bg-muted-foreground/20 text-muted-foreground"
                              : tip.status === "good"
                              ? "bg-success text-success-foreground"
                              : "bg-accent text-accent-foreground"
                          }`}>
                            {tip.status === "urgent" ? "Do Now" : tip.status === "pause" ? "Skip" : tip.status === "good" ? "Good" : "Wait"}
                          </span>
                        </div>
                        <p className="text-xs lg:text-sm text-muted-foreground">{tip.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
