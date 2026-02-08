import { useState, useEffect } from "react";
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
import { User, MapPin, Sprout, Loader2, Save, Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const soilTypes = ["Clay", "Sandy", "Loamy", "Silty", "Peaty", "Chalky", "Black Soil", "Red Soil", "Alluvial Soil"];
const languages = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "pa", label: "ਪੰਜਾਬੀ (Punjabi)" },
  { value: "mr", label: "मराठी (Marathi)" },
  { value: "ta", label: "தமிழ் (Tamil)" },
  { value: "te", label: "తెలుగు (Telugu)" },
  { value: "bn", label: "বাংলা (Bengali)" },
  { value: "gu", label: "ગુજરાતી (Gujarati)" },
  { value: "kn", label: "ಕನ್ನಡ (Kannada)" },
];

interface Profile {
  full_name: string;
  phone: string;
  location: string;
  farm_size: string;
  soil_type: string;
  primary_crop: string;
  language_preference: string;
}

export default function Settings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    phone: "",
    location: "",
    farm_size: "",
    soil_type: "",
    primary_crop: "",
    language_preference: "en",
  });

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (data) {
      setProfile({
        full_name: data.full_name || "",
        phone: data.phone || "",
        location: data.location || "",
        farm_size: data.farm_size || "",
        soil_type: data.soil_type || "",
        primary_crop: data.primary_crop || "",
        language_preference: data.language_preference || "en",
      });
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name || null,
        phone: profile.phone || null,
        location: profile.location || null,
        farm_size: profile.farm_size || null,
        soil_type: profile.soil_type || null,
        primary_crop: profile.primary_crop || null,
        language_preference: profile.language_preference || "en",
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("Profile update error:", error);
      toast({ variant: "destructive", title: "Failed to save profile" });
    } else {
      toast({ title: "Profile updated! ✅" });
    }
    setIsSaving(false);
  };

  const updateField = (field: keyof Profile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="lg:ml-64">
          <Header title="Settings" subtitle="Manage your profile and preferences" />
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header title="Settings" subtitle="Manage your profile and preferences" />
        
        <main className="p-4 lg:p-6 max-w-3xl">
          {/* Personal Info */}
          <div className="bg-card rounded-xl border border-border p-5 lg:p-6 mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Personal Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  placeholder="Your name"
                  value={profile.full_name}
                  onChange={(e) => updateField("full_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  placeholder="+91 XXXXX XXXXX"
                  value={profile.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="opacity-60" />
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={profile.language_preference} onValueChange={(v) => updateField("language_preference", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {languages.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Farm Details */}
          <div className="bg-card rounded-xl border border-border p-5 lg:p-6 mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
              <Sprout className="w-5 h-5 text-success" />
              Farm Details
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location / Region</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="e.g., Ludhiana, Punjab"
                    value={profile.location}
                    onChange={(e) => updateField("location", e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Used for weather data and crop recommendations</p>
              </div>
              <div className="space-y-2">
                <Label>Farm Size</Label>
                <Input
                  placeholder="e.g., 5 hectares"
                  value={profile.farm_size}
                  onChange={(e) => updateField("farm_size", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Soil Type</Label>
                <Select value={profile.soil_type} onValueChange={(v) => updateField("soil_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Select soil type" /></SelectTrigger>
                  <SelectContent>
                    {soilTypes.map((s) => (
                      <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Primary Crop</Label>
                <Input
                  placeholder="e.g., Wheat, Rice"
                  value={profile.primary_crop}
                  onChange={(e) => updateField("primary_crop", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-primary/5 rounded-xl border border-primary/20 p-4 mb-6">
            <div className="flex items-start gap-3">
              <Leaf className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground text-sm">Why fill this out?</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Your farm details are used to personalize AI recommendations across all modules — weather alerts, crop advice, 
                  irrigation schedules, and fertilizer plans will be tailored to your specific conditions.
                </p>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />Save Profile</>
            )}
          </Button>
        </main>
      </div>
    </div>
  );
}
