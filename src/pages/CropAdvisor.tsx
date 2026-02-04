import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
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
import { Sprout, TrendingUp, DollarSign, Calendar, Sparkles } from "lucide-react";

const soilTypes = [
  "Clay",
  "Sandy",
  "Loamy",
  "Silty",
  "Peaty",
  "Chalky",
  "Black Soil",
];

const seasons = ["Kharif (Monsoon)", "Rabi (Winter)", "Zaid (Summer)"];

const mockRecommendations = [
  {
    crop: "Rice",
    yieldEstimate: "4.5 tons/hectare",
    profit: "$1,200/hectare",
    duration: "120-150 days",
    suitability: 95,
    tips: "Best planted in June-July. Requires consistent water supply.",
  },
  {
    crop: "Wheat",
    yieldEstimate: "3.8 tons/hectare",
    profit: "$950/hectare",
    duration: "100-120 days",
    suitability: 88,
    tips: "Plant in November for optimal results. Requires moderate irrigation.",
  },
  {
    crop: "Maize",
    yieldEstimate: "5.2 tons/hectare",
    profit: "$1,100/hectare",
    duration: "80-100 days",
    suitability: 82,
    tips: "Drought-resistant variety recommended for your region.",
  },
];

export default function CropAdvisor() {
  const [location, setLocation] = useState("");
  const [soilType, setSoilType] = useState("");
  const [season, setSeason] = useState("");
  const [showResults, setShowResults] = useState(false);

  const handleGetRecommendations = () => {
    if (location && soilType && season) {
      setShowResults(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64">
        <Header 
          title="Crop Advisor" 
          subtitle="Get AI-powered crop recommendations based on your farm conditions" 
        />
        
        <main className="p-6">
          {/* Input Form */}
          <div className="bg-card rounded-xl border border-border p-6 mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-secondary" />
              Tell us about your farm
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="location">Location / Region</Label>
                <Input
                  id="location"
                  placeholder="e.g., Punjab, Maharashtra"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="soil">Soil Type</Label>
                <Select value={soilType} onValueChange={setSoilType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select soil type" />
                  </SelectTrigger>
                  <SelectContent>
                    {soilTypes.map((soil) => (
                      <SelectItem key={soil} value={soil.toLowerCase()}>
                        {soil}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="season">Planting Season</Label>
                <Select value={season} onValueChange={setSeason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select season" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons.map((s) => (
                      <SelectItem key={s} value={s.toLowerCase()}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              className="mt-6" 
              size="lg"
              onClick={handleGetRecommendations}
              disabled={!location || !soilType || !season}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Get AI Recommendations
            </Button>
          </div>

          {/* Results */}
          {showResults && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground">
                Recommended Crops for Your Farm
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {mockRecommendations.map((rec, index) => (
                  <div
                    key={rec.crop}
                    className="bg-card rounded-xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                          <Sprout className="w-6 h-6 text-success" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{rec.crop}</h4>
                          <span className="text-sm text-success font-medium">
                            {rec.suitability}% match
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Expected Yield:</span>
                        <span className="font-medium text-foreground">{rec.yieldEstimate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Est. Profit:</span>
                        <span className="font-medium text-success">{rec.profit}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium text-foreground">{rec.duration}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">{rec.tips}</p>
                    </div>

                    <Button variant="outline" className="w-full mt-4">
                      View Full Plan
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
