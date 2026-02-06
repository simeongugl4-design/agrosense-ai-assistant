import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { 
  Droplets, 
  Calendar, 
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Waves,
  Sun,
  Cloud
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

const cropWaterNeeds = {
  rice: { daily: 8, stage: "Flowering", optimal: "6-10 mm/day" },
  wheat: { daily: 4, stage: "Grain filling", optimal: "3-5 mm/day" },
  maize: { daily: 5, stage: "Vegetative", optimal: "4-6 mm/day" },
  cotton: { daily: 6, stage: "Boll development", optimal: "5-7 mm/day" },
  sugarcane: { daily: 7, stage: "Grand growth", optimal: "6-8 mm/day" },
};

const irrigationSchedule = [
  { day: "Today", time: "6:00 AM", duration: "45 min", status: "completed", waterUsed: 120 },
  { day: "Today", time: "5:00 PM", duration: "30 min", status: "upcoming", waterUsed: 80 },
  { day: "Tomorrow", time: "6:00 AM", duration: "45 min", status: "scheduled", waterUsed: 120 },
  { day: "Wed", time: "Skip", duration: "-", status: "rain", waterUsed: 0 },
  { day: "Thu", time: "Skip", duration: "-", status: "rain", waterUsed: 0 },
];

export default function Irrigation() {
  const [selectedCrop, setSelectedCrop] = useState("rice");
  const [fieldSize, setFieldSize] = useState("5");
  
  const currentCrop = cropWaterNeeds[selectedCrop as keyof typeof cropWaterNeeds];
  const dailyWaterNeed = currentCrop.daily * parseFloat(fieldSize || "1") * 10; // liters per day

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header 
          title="Smart Irrigation" 
          subtitle="AI-optimized water management for your crops" 
        />
        
        <main className="p-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Usage</p>
                  <p className="text-2xl font-bold text-foreground">1,240 L</p>
                  <p className="text-sm text-success">-8% from yesterday</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Droplets className="w-6 h-6 text-accent" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Weekly Savings</p>
                  <p className="text-2xl font-bold text-success">2,450 L</p>
                  <p className="text-sm text-muted-foreground">₹180 saved</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-success" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Soil Moisture</p>
                  <p className="text-2xl font-bold text-foreground">68%</p>
                  <p className="text-sm text-success">Optimal level</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Waves className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Next Irrigation</p>
                  <p className="text-2xl font-bold text-foreground">5:00 PM</p>
                  <p className="text-sm text-muted-foreground">In 3 hours</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Water Needs Calculator */}
            <div className="lg:col-span-1 bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-accent" />
                Water Needs Calculator
              </h3>

              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <Label>Crop Type</Label>
                  <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rice">Rice</SelectItem>
                      <SelectItem value="wheat">Wheat</SelectItem>
                      <SelectItem value="maize">Maize</SelectItem>
                      <SelectItem value="cotton">Cotton</SelectItem>
                      <SelectItem value="sugarcane">Sugarcane</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Field Size (hectares)</Label>
                  <Input 
                    type="number" 
                    value={fieldSize} 
                    onChange={(e) => setFieldSize(e.target.value)}
                    placeholder="e.g., 5"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 mb-4">
                <p className="text-sm text-muted-foreground mb-1">Daily Water Requirement</p>
                <p className="text-3xl font-bold text-accent">{dailyWaterNeed.toLocaleString()} L</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Growth stage: {currentCrop.stage}
                </p>
                <p className="text-sm text-muted-foreground">
                  Optimal: {currentCrop.optimal}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Soil moisture</span>
                  <span className="font-medium text-foreground">68%</span>
                </div>
                <Progress value={68} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Recommended: 60-75% for {selectedCrop}
                </p>
              </div>

              <Button className="w-full mt-6">
                Get Personalized Schedule
              </Button>
            </div>

            {/* Irrigation Schedule */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Smart Irrigation Schedule
              </h3>

              <div className="space-y-3">
                {irrigationSchedule.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      item.status === "completed"
                        ? "bg-success/5 border-success/30"
                        : item.status === "upcoming"
                        ? "bg-warning/5 border-warning/30"
                        : item.status === "rain"
                        ? "bg-accent/5 border-accent/30"
                        : "bg-muted/50 border-border"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {item.status === "completed" ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : item.status === "upcoming" ? (
                        <AlertCircle className="w-5 h-5 text-warning" />
                      ) : item.status === "rain" ? (
                        <Cloud className="w-5 h-5 text-accent" />
                      ) : (
                        <Clock className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{item.day}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.status === "rain" ? "Rain expected - skip irrigation" : `${item.time} • ${item.duration}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {item.status !== "rain" && (
                        <>
                          <p className="font-medium text-foreground">{item.waterUsed} L</p>
                          <p className="text-xs text-muted-foreground">water usage</p>
                        </>
                      )}
                      {item.status === "rain" && (
                        <span className="text-sm text-success font-medium">Saving water!</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Weather-based Alert */}
              <div className="mt-6 p-4 rounded-xl bg-accent/10 border border-accent/30">
                <div className="flex items-start gap-3">
                  <Cloud className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground">Weather-Smart Scheduling</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Rain is expected on Wednesday and Thursday. Your irrigation schedule has been automatically 
                      adjusted to save water and prevent overwatering. This will save you approximately ₹120 this week.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button className="flex-1">Start Manual Irrigation</Button>
                <Button variant="outline" className="flex-1">Edit Schedule</Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
