import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { 
  FlaskConical, 
  Leaf, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  DollarSign,
  Sprout
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

const cropStages = [
  "Seedling",
  "Vegetative",
  "Flowering",
  "Fruiting/Grain filling",
  "Maturity",
];

const nutrientLevels = {
  nitrogen: { current: 45, optimal: 60, status: "low" },
  phosphorus: { current: 55, optimal: 50, status: "good" },
  potassium: { current: 35, optimal: 55, status: "low" },
};

const fertilizerRecommendations = [
  {
    nutrient: "Nitrogen (N)",
    product: "Urea (46% N)",
    quantity: "50 kg/hectare",
    timing: "Apply now - split into 2 doses",
    method: "Broadcasting before irrigation",
    cost: "₹450",
    priority: "high",
  },
  {
    nutrient: "Potassium (K)",
    product: "Muriate of Potash (60% K₂O)",
    quantity: "30 kg/hectare",
    timing: "Apply within 1 week",
    method: "Side dressing near roots",
    cost: "₹380",
    priority: "high",
  },
  {
    nutrient: "Micronutrients",
    product: "Zinc Sulphate",
    quantity: "25 kg/hectare",
    timing: "Apply during next irrigation",
    method: "Foliar spray or soil application",
    cost: "₹200",
    priority: "medium",
  },
];

const applicationSchedule = [
  { week: "Week 1", action: "First dose of Urea (25 kg/ha)", status: "current" },
  { week: "Week 2", action: "Potash application", status: "upcoming" },
  { week: "Week 3", action: "Second dose of Urea (25 kg/ha)", status: "scheduled" },
  { week: "Week 4", action: "Micronutrient spray", status: "scheduled" },
];

export default function Fertilizer() {
  const [cropType, setCropType] = useState("rice");
  const [cropStage, setCropStage] = useState("vegetative");
  const [fieldSize, setFieldSize] = useState("5");

  const totalCost = fertilizerRecommendations.reduce((sum, rec) => {
    return sum + parseInt(rec.cost.replace("₹", "").replace(",", "")) * parseFloat(fieldSize || "1");
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64">
        <Header 
          title="Fertilizer Planner" 
          subtitle="AI-optimized nutrient management for maximum yield" 
        />
        
        <main className="p-6">
          {/* Soil Nutrient Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Object.entries(nutrientLevels).map(([nutrient, data]) => (
              <div key={nutrient} className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground capitalize">{nutrient}</p>
                    <p className="text-2xl font-bold text-foreground">{data.current}%</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    data.status === "good" ? "bg-success/10" : "bg-warning/10"
                  }`}>
                    {data.status === "good" ? (
                      <CheckCircle className="w-6 h-6 text-success" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-warning" />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Current</span>
                    <span className="text-muted-foreground">Optimal: {data.optimal}%</span>
                  </div>
                  <Progress 
                    value={(data.current / data.optimal) * 100} 
                    className={`h-2 ${data.status === "good" ? "[&>div]:bg-success" : "[&>div]:bg-warning"}`} 
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Input Form */}
            <div className="lg:col-span-1 bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <Sprout className="w-5 h-5 text-success" />
                Your Crop Details
              </h3>

              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <Label>Crop Type</Label>
                  <Select value={cropType} onValueChange={setCropType}>
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
                  <Label>Growth Stage</Label>
                  <Select value={cropStage} onValueChange={setCropStage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cropStages.map((stage) => (
                        <SelectItem key={stage} value={stage.toLowerCase()}>
                          {stage}
                        </SelectItem>
                      ))}
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

              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 mb-4">
                <p className="text-sm text-muted-foreground mb-1">Estimated Total Cost</p>
                <p className="text-3xl font-bold text-primary">₹{totalCost.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  For {fieldSize} hectares
                </p>
              </div>

              <div className="p-4 rounded-xl bg-success/10 border border-success/30">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <p className="text-sm font-medium text-success">Expected Yield Boost</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Following this plan can increase your yield by 15-20% compared to 
                  standard fertilization.
                </p>
              </div>
            </div>

            {/* Recommendations */}
            <div className="lg:col-span-2 space-y-6">
              {/* Fertilizer Recommendations */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-warning" />
                  AI Fertilizer Recommendations
                </h3>

                <div className="space-y-4">
                  {fertilizerRecommendations.map((rec, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border ${
                        rec.priority === "high"
                          ? "bg-warning/5 border-warning/30"
                          : "bg-muted/50 border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-foreground">{rec.nutrient}</h4>
                          <p className="text-sm text-primary">{rec.product}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          rec.priority === "high"
                            ? "bg-warning text-warning-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {rec.priority === "high" ? "High Priority" : "Medium"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Quantity</p>
                          <p className="font-medium text-foreground">{rec.quantity}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Cost/hectare</p>
                          <p className="font-medium text-foreground">{rec.cost}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Application</p>
                          <p className="font-medium text-foreground">{rec.method}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Application Schedule */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Application Schedule
                </h3>

                <div className="space-y-3">
                  {applicationSchedule.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-4 p-4 rounded-xl border ${
                        item.status === "current"
                          ? "bg-primary/5 border-primary/30"
                          : item.status === "upcoming"
                          ? "bg-warning/5 border-warning/30"
                          : "bg-muted/50 border-border"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        item.status === "current"
                          ? "bg-primary text-primary-foreground"
                          : item.status === "upcoming"
                          ? "bg-warning text-warning-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.week}</p>
                        <p className="text-sm text-muted-foreground">{item.action}</p>
                      </div>
                      {item.status === "current" && (
                        <Button size="sm">Apply Now</Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full mt-6">
                  Download Full Schedule (PDF)
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
