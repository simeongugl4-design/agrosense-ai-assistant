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
import { useDashboardTranslations } from "@/hooks/useDashboardTranslations";

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
  const { copy } = useDashboardTranslations();
  const soilTypes = [
    { value: "clay", label: copy.common.soilTypes.clay },
    { value: "sandy", label: copy.common.soilTypes.sandy },
    { value: "loamy", label: copy.common.soilTypes.loamy },
    { value: "silty", label: copy.common.soilTypes.silty },
    { value: "peaty", label: copy.common.soilTypes.peaty },
    { value: "chalky", label: copy.common.soilTypes.chalky },
    { value: "black soil", label: copy.common.soilTypes.blackSoil },
    { value: "red soil", label: copy.common.soilTypes.redSoil },
    { value: "alluvial soil", label: copy.common.soilTypes.alluvialSoil },
  ];
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

  useEffect(() => { if (user) void fetchProfile(); }, [user]);

  const fetchProfile = async () => {
    setIsLoading(true);
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
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

    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name || null,
      phone: profile.phone || null,
      location: profile.location || null,
      farm_size: profile.farm_size || null,
      soil_type: profile.soil_type || null,
      primary_crop: profile.primary_crop || null,
      language_preference: profile.language_preference || "en",
    }).eq("user_id", user.id);

    if (error) {
      console.error("Profile update error:", error);
      toast({ variant: "destructive", title: copy.settings.errors.failedSave });
    } else {
      toast({ title: copy.settings.errors.saved });
    }
    setIsSaving(false);
  };

  const updateField = (field: keyof Profile, value: string) => setProfile((prev) => ({ ...prev, [field]: value }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="lg:ml-64">
          <Header title={copy.settings.title} subtitle={copy.settings.subtitle} />
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header title={copy.settings.title} subtitle={copy.settings.subtitle} />

        <main className="p-4 lg:p-6 max-w-3xl">
          <div className="bg-card rounded-xl border border-border p-5 lg:p-6 mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2"><User className="w-5 h-5 text-primary" />{copy.settings.personalInformation}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{copy.settings.labels.fullName}</Label>
                <Input placeholder={copy.settings.placeholders.fullName} value={profile.full_name} onChange={(e) => updateField("full_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{copy.settings.labels.phone}</Label>
                <Input placeholder={copy.settings.placeholders.phone} value={profile.phone} onChange={(e) => updateField("phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{copy.settings.labels.email}</Label>
                <Input value={user?.email || ""} disabled className="opacity-60" />
              </div>
              <div className="space-y-2">
                <Label>{copy.settings.labels.language}</Label>
                <Select value={profile.language_preference} onValueChange={(v) => updateField("language_preference", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{languages.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-5 lg:p-6 mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2"><Sprout className="w-5 h-5 text-success" />{copy.settings.farmDetails}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{copy.settings.labels.location}</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input className="pl-10" placeholder={copy.settings.placeholders.location} value={profile.location} onChange={(e) => updateField("location", e.target.value)} />
                </div>
                <p className="text-xs text-muted-foreground">{copy.settings.labels.weatherUsage}</p>
              </div>
              <div className="space-y-2">
                <Label>{copy.settings.labels.farmSize}</Label>
                <Input placeholder={copy.settings.placeholders.farmSize} value={profile.farm_size} onChange={(e) => updateField("farm_size", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{copy.settings.labels.soilType}</Label>
                <Select value={profile.soil_type} onValueChange={(v) => updateField("soil_type", v)}>
                  <SelectTrigger><SelectValue placeholder={copy.settings.placeholders.soilType} /></SelectTrigger>
                  <SelectContent>{soilTypes.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{copy.settings.labels.primaryCrop}</Label>
                <Input placeholder={copy.settings.placeholders.primaryCrop} value={profile.primary_crop} onChange={(e) => updateField("primary_crop", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="bg-primary/5 rounded-xl border border-primary/20 p-4 mb-6">
            <div className="flex items-start gap-3">
              <Leaf className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground text-sm">{copy.settings.labels.whyFill}</h4>
                <p className="text-xs text-muted-foreground mt-1">{copy.settings.labels.whyFillDescription}</p>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{copy.settings.buttons.loading}</> : <><Save className="w-4 h-4 mr-2" />{copy.settings.buttons.submit}</>}
          </Button>
        </main>
      </div>
    </div>
  );
}
