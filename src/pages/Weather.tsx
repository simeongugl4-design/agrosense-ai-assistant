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
  Sprout
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock weather data - in production, this would come from a weather API
const currentWeather = {
  temp: 28,
  humidity: 65,
  windSpeed: 12,
  condition: "Partly Cloudy",
  feelsLike: 30,
  uvIndex: 7,
  rainfall: 0,
};

const weeklyForecast = [
  { day: "Today", high: 28, low: 22, icon: Cloud, condition: "Partly Cloudy", rainChance: 20 },
  { day: "Tomorrow", high: 30, low: 23, icon: Sun, condition: "Sunny", rainChance: 5 },
  { day: "Wed", high: 27, low: 21, icon: CloudRain, condition: "Light Rain", rainChance: 80 },
  { day: "Thu", high: 26, low: 20, icon: CloudRain, condition: "Heavy Rain", rainChance: 95 },
  { day: "Fri", high: 28, low: 22, icon: Cloud, condition: "Cloudy", rainChance: 40 },
  { day: "Sat", high: 31, low: 24, icon: Sun, condition: "Sunny", rainChance: 10 },
  { day: "Sun", high: 32, low: 25, icon: Sun, condition: "Hot & Sunny", rainChance: 5 },
];

const farmingAlerts = [
  {
    type: "warning",
    title: "Heavy Rain Alert",
    message: "Heavy rainfall expected on Thursday. Consider harvesting mature crops before then. Avoid irrigation 24 hours before rain.",
    icon: CloudRain,
  },
  {
    type: "info",
    title: "Optimal Sowing Window",
    message: "Saturday-Sunday will have ideal conditions for sowing. Soil moisture and temperature will be perfect for germination.",
    icon: Sprout,
  },
  {
    type: "success",
    title: "Good Drying Conditions",
    message: "Next 48 hours are excellent for drying harvested crops or hay. Take advantage of low humidity.",
    icon: Sun,
  },
];

const farmingTips = [
  { activity: "Irrigation", recommendation: "Skip today - rain expected in 2 days", status: "pause" },
  { activity: "Pesticide Spray", recommendation: "Apply before Wednesday rain", status: "urgent" },
  { activity: "Fertilizer", recommendation: "Wait until after rain for better absorption", status: "wait" },
  { activity: "Harvesting", recommendation: "Complete wheat harvest before Thursday", status: "urgent" },
];

export default function Weather() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header 
          title="Weather Intelligence" 
          subtitle="AI-powered weather insights for smarter farming decisions" 
        />
        
        <main className="p-6">
          {/* Current Weather Card */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1 bg-gradient-to-br from-accent to-accent/80 rounded-xl p-6 text-accent-foreground">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm opacity-80">Current Weather</p>
                  <p className="text-sm opacity-60">Your Location</p>
                </div>
                <Cloud className="w-8 h-8" />
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <Sun className="w-20 h-20" />
                <div>
                  <p className="text-5xl font-bold">{currentWeather.temp}°C</p>
                  <p className="opacity-80">{currentWeather.condition}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <Droplets className="w-5 h-5 mx-auto mb-1 opacity-80" />
                  <p className="text-sm font-medium">{currentWeather.humidity}%</p>
                  <p className="text-xs opacity-60">Humidity</p>
                </div>
                <div className="text-center">
                  <Wind className="w-5 h-5 mx-auto mb-1 opacity-80" />
                  <p className="text-sm font-medium">{currentWeather.windSpeed} km/h</p>
                  <p className="text-xs opacity-60">Wind</p>
                </div>
                <div className="text-center">
                  <Thermometer className="w-5 h-5 mx-auto mb-1 opacity-80" />
                  <p className="text-sm font-medium">{currentWeather.feelsLike}°C</p>
                  <p className="text-xs opacity-60">Feels Like</p>
                </div>
              </div>
            </div>

            {/* Farming Alerts */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                AI Farming Alerts
              </h3>
              <div className="space-y-4">
                {farmingAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      alert.type === "warning"
                        ? "bg-warning/10 border-warning/30"
                        : alert.type === "success"
                        ? "bg-success/10 border-success/30"
                        : "bg-accent/10 border-accent/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <alert.icon className={`w-5 h-5 mt-0.5 ${
                        alert.type === "warning" ? "text-warning" : 
                        alert.type === "success" ? "text-success" : "text-accent"
                      }`} />
                      <div>
                        <h4 className="font-medium text-foreground">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 7-Day Forecast */}
          <div className="bg-card rounded-xl border border-border p-6 mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              7-Day Forecast
            </h3>
            <div className="grid grid-cols-7 gap-4">
              {weeklyForecast.map((day, index) => (
                <div
                  key={index}
                  className={`text-center p-4 rounded-xl transition-all ${
                    index === 0
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <p className={`text-sm font-medium mb-2 ${index === 0 ? "text-primary" : "text-foreground"}`}>
                    {day.day}
                  </p>
                  <day.icon className={`w-8 h-8 mx-auto mb-2 ${
                    day.condition.includes("Rain") ? "text-accent" : "text-secondary"
                  }`} />
                  <p className="text-lg font-bold text-foreground">{day.high}°</p>
                  <p className="text-sm text-muted-foreground">{day.low}°</p>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <Droplets className="w-3 h-3 text-accent" />
                    <span className="text-xs text-muted-foreground">{day.rainChance}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Farming Activity Recommendations */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Sprout className="w-5 h-5 text-success" />
              Smart Farming Recommendations
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {farmingTips.map((tip, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border ${
                    tip.status === "urgent"
                      ? "bg-warning/10 border-warning/30"
                      : tip.status === "pause"
                      ? "bg-muted border-border"
                      : "bg-accent/10 border-accent/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">{tip.activity}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      tip.status === "urgent"
                        ? "bg-warning text-warning-foreground"
                        : tip.status === "pause"
                        ? "bg-muted-foreground/20 text-muted-foreground"
                        : "bg-accent text-accent-foreground"
                    }`}>
                      {tip.status === "urgent" ? "Do Now" : tip.status === "pause" ? "Skip" : "Wait"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{tip.recommendation}</p>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-6">
              Get Personalized Schedule
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
