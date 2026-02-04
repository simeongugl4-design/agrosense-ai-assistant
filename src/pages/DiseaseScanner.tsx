import { useState, useRef } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Leaf, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

export default function DiseaseScanner() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    disease: string;
    confidence: number;
    treatment: string;
    prevention: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setResult({
      disease: "Leaf Blight (Bacterial)",
      confidence: 94,
      treatment: "Apply copper-based bactericide immediately. Remove and destroy infected leaves. Avoid overhead irrigation to reduce humidity.",
      prevention: "Use disease-resistant varieties. Ensure proper spacing for air circulation. Rotate crops annually. Apply preventive fungicide during humid seasons.",
    });
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64">
        <Header 
          title="Disease Scanner" 
          subtitle="Upload a photo of your crop to detect diseases instantly" 
        />
        
        <main className="p-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Upload Crop Image
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
                    or drag and drop a photo of your crop
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
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-2 rounded-lg hover:bg-destructive/90 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Leaf className="w-4 h-4 mr-2" />
                        Analyze Crop Health
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Results Section */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Analysis Results
              </h3>

              {!result && !isAnalyzing && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Leaf className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">
                    Upload an image to get AI-powered disease detection
                  </p>
                </div>
              )}

              {isAnalyzing && (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p className="text-foreground font-medium">Analyzing your crop...</p>
                  <p className="text-sm text-muted-foreground">This may take a few seconds</p>
                </div>
              )}

              {result && (
                <div className="space-y-6">
                  {/* Disease Detected */}
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-destructive flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Disease Detected
                      </h4>
                      <span className="text-sm font-medium text-destructive">
                        {result.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-foreground font-medium">{result.disease}</p>
                  </div>

                  {/* Treatment */}
                  <div className="p-4 rounded-xl bg-success/10 border border-success/30">
                    <h4 className="font-semibold text-success flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4" />
                      Recommended Treatment
                    </h4>
                    <p className="text-foreground text-sm leading-relaxed">
                      {result.treatment}
                    </p>
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
