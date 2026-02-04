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
  Thermometer
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const weatherData = {
    temp: "28°C",
    humidity: "65%",
    wind: "12 km/h",
    condition: "Partly Cloudy",
  };

  const alerts = [
    { type: "warning", message: "Heavy rain expected in 2 days. Consider harvesting wheat early." },
    { type: "info", message: "Optimal sowing window for rice starts next week." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64">
        <Header title="Dashboard" subtitle="Welcome back! Here's your farm overview." />
        
        <main className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Active Crops"
              value="12"
              change="3 ready for harvest"
              changeType="positive"
              icon={Sprout}
              iconColor="text-success"
              iconBg="bg-success/10"
            />
            <StatCard
              title="Yield Forecast"
              value="4.2 tons"
              change="+15% vs last season"
              changeType="positive"
              icon={TrendingUp}
              iconColor="text-primary"
              iconBg="bg-primary/10"
            />
            <StatCard
              title="Water Usage"
              value="1,240 L"
              change="-8% this week"
              changeType="positive"
              icon={Droplets}
              iconColor="text-accent"
              iconBg="bg-accent/10"
            />
            <StatCard
              title="Health Score"
              value="92%"
              change="All crops healthy"
              changeType="positive"
              icon={Sprout}
              iconColor="text-success"
              iconBg="bg-success/10"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Weather Widget */}
            <div className="lg:col-span-1 bg-gradient-to-br from-accent to-accent/80 rounded-xl p-6 text-accent-foreground">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Today's Weather</h3>
                <Cloud className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-4 mb-6">
                <Sun className="w-16 h-16" />
                <div>
                  <p className="text-4xl font-bold">{weatherData.temp}</p>
                  <p className="opacity-80">{weatherData.condition}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 opacity-80" />
                  <span className="text-sm">Humidity: {weatherData.humidity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 opacity-80" />
                  <span className="text-sm">Wind: {weatherData.wind}</span>
                </div>
              </div>
              <Button variant="secondary" className="w-full mt-6">
                View Full Forecast
              </Button>
            </div>

            {/* Alerts */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-foreground">AI Recommendations</h3>
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div className="space-y-4">
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-4 rounded-lg border",
                      alert.type === "warning" 
                        ? "bg-warning/10 border-warning/30" 
                        : "bg-accent/10 border-accent/30"
                    )}
                  >
                    <p className="text-foreground">{alert.message}</p>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Recommendations
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="font-semibold text-lg text-foreground mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Sprout, label: "Plan New Crop", color: "bg-success/10 text-success" },
                { icon: Cloud, label: "Check Weather", color: "bg-accent/10 text-accent" },
                { icon: Droplets, label: "Log Irrigation", color: "bg-accent/10 text-accent" },
                { icon: Thermometer, label: "Soil Analysis", color: "bg-warning/10 text-warning" },
              ].map((action, index) => (
                <button
                  key={index}
                  className="flex flex-col items-center gap-3 p-6 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
