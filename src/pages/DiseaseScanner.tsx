import { useState, useRef } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Leaf, AlertTriangle, CheckCircle, Loader2, Stethoscope } from "lucide-react";
import { analyzeCropDisease } from "@/lib/ai-service";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DiseaseResult {
  disease: string;
  confidence: number;
  severity: string;
  symptoms: string[];
  treatment: {
    organic: string;
    chemical: string;
    immediate: string;
  };
  prevention: string;
  expertNeeded: boolean;
  expertReason: string;
}

export default function DiseaseScanner() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [cropType, setCropType] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload an image smaller than 10MB",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      const analysis = await analyzeCropDisease({
        imageBase64: selectedImage || undefined,
        cropType: cropType || undefined,
        symptoms: symptoms || undefined,
      });
      
      setResult(analysis);
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze. Please try again.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "severe":
        return "bg-destructive/10 text-destructive border-destructive/30";
      case "moderate":
        return "bg-warning/10 text-warning border-warning/30";
      case "mild":
        return "bg-success/10 text-success border-success/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64">
        <Header 
          title="Disease Scanner" 
          subtitle="Upload a photo or describe symptoms for AI-powered diagnosis" 
        />
        
        <main className="p-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Scan Your Crop
              </h3>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />

              {!selectedImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-foreground font-medium mb-2">Click to upload an image</p>
                  <p className="text-sm text-muted-foreground text-center">
                    Upload a clear photo of the affected crop
                  </p>
                  <p className="text-xs text-muted-foreground mt-4">
                    Supports: JPG, PNG, WEBP (max 10MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden">
                    <img
                      src={selectedImage}
                      alt="Uploaded crop"
                      className="w-full h-64 object-cover"
                    />
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setResult(null);
                      }}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground w-8 h-8 rounded-lg hover:bg-destructive/90 transition-colors flex items-center justify-center text-lg font-bold"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* Additional inputs */}
              <div className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="cropType">Crop Type (optional)</Label>
                  <Input
                    id="cropType"
                    placeholder="e.g., Tomato, Rice, Wheat"
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="symptoms">Describe Symptoms (optional)</Label>
                  <Input
                    id="symptoms"
                    placeholder="e.g., Yellow spots on leaves, wilting"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                className="w-full mt-6" 
                size="lg"
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!selectedImage && !symptoms)}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Stethoscope className="w-4 h-4 mr-2" />
                    Analyze Crop Health
                  </>
                )}
              </Button>
            </div>

            {/* Results Section */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                AI Diagnosis
              </h3>

              {!result && !isAnalyzing && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Leaf className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">
                    Upload an image or describe symptoms to get AI-powered diagnosis
                  </p>
                </div>
              )}

              {isAnalyzing && (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p className="text-foreground font-medium">Analyzing your crop...</p>
                  <p className="text-sm text-muted-foreground">Our AI is examining the image</p>
                </div>
              )}

              {result && (
                <div className="space-y-5 overflow-y-auto max-h-[600px]">
                  {/* Disease Detected */}
                  <div className={`p-4 rounded-xl border ${getSeverityColor(result.severity)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Diagnosis
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium px-2 py-1 rounded-full bg-background/50">
                          {result.severity}
                        </span>
                        <span className="text-sm font-medium">
                          {result.confidence}% confidence
                        </span>
                      </div>
                    </div>
                    <p className="font-medium text-lg">{result.disease}</p>
                    {result.symptoms && result.symptoms.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm opacity-80">Symptoms:</p>
                        <ul className="text-sm list-disc list-inside opacity-80">
                          {result.symptoms.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Immediate Action */}
                  <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
                    <h4 className="font-semibold text-warning flex items-center gap-2 mb-2">
                      ⚡ Immediate Action
                    </h4>
                    <p className="text-foreground text-sm leading-relaxed">
                      {result.treatment.immediate}
                    </p>
                  </div>

                  {/* Treatment */}
                  <div className="p-4 rounded-xl bg-success/10 border border-success/30">
                    <h4 className="font-semibold text-success flex items-center gap-2 mb-3">
                      <CheckCircle className="w-4 h-4" />
                      Treatment Options
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">🌿 Organic:</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {result.treatment.organic}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">💊 Chemical:</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {result.treatment.chemical}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Prevention */}
                  <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
                    <h4 className="font-semibold text-accent flex items-center gap-2 mb-2">
                      <Leaf className="w-4 h-4" />
                      Prevention Tips
                    </h4>
                    <p className="text-foreground text-sm leading-relaxed">
                      {result.prevention}
                    </p>
                  </div>

                  {/* Expert Consultation */}
                  {result.expertNeeded && (
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                      <h4 className="font-semibold text-destructive flex items-center gap-2 mb-2">
                        👨‍🌾 Expert Consultation Recommended
                      </h4>
                      <p className="text-foreground text-sm leading-relaxed">
                        {result.expertReason}
                      </p>
                    </div>
                  )}

                  <Button variant="outline" className="w-full">
                    Get Expert Consultation
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
