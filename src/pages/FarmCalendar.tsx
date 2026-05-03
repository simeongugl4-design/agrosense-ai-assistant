import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  Plus,
  Sprout,
  Droplets,
  Bug,
  FlaskConical,
  CheckCircle2,
  Circle,
  Trash2,
  Loader2,
  AlertTriangle,
  Wheat,
  Zap,
  ListPlus,
  ArrowLeft,
  X,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useDashboardTranslations, formatDashboardText } from "@/hooks/useDashboardTranslations";

interface FarmEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  crop: string | null;
  plot_name: string | null;
  event_date: string;
  reminder_date: string | null;
  is_completed: boolean;
  priority: string;
  created_at: string;
}

const priorityColors: Record<string, string> = {
  high: "border-l-destructive bg-destructive/5",
  medium: "border-l-warning bg-warning/5",
  low: "border-l-success bg-success/5",
};

interface CropTemplate {
  name: string;
  crop: string;
  events: Array<{
    title: string;
    event_type: string;
    dayOffset: number;
    priority: string;
    description: string;
  }>;
}

type CropTemplateKey = "kaukau" | "taro" | "rice" | "maize";

const CROP_TEMPLATES: Array<CropTemplate & { key: CropTemplateKey }> = [
  {
    key: "kaukau",
    name: "Kaukau (Sweet Potato) Cycle",
    crop: "Kaukau",
    events: [
      { title: "Prepare mounds/beds", event_type: "general", dayOffset: 0, priority: "high", description: "Clear land, prepare raised mounds or beds for planting" },
      { title: "Plant vine cuttings", event_type: "sowing", dayOffset: 7, priority: "high", description: "Plant 30cm vine cuttings at 30cm spacing" },
      { title: "First watering", event_type: "irrigation", dayOffset: 8, priority: "high", description: "Water thoroughly after planting" },
      { title: "Apply organic fertilizer", event_type: "fertilizer", dayOffset: 21, priority: "medium", description: "Apply compost or organic fertilizer around plants" },
      { title: "Weed & check for pests", event_type: "spraying", dayOffset: 30, priority: "medium", description: "Remove weeds and check for sweet potato weevil" },
      { title: "Second fertilizer application", event_type: "fertilizer", dayOffset: 60, priority: "medium", description: "Side-dress with fertilizer for tuber development" },
      { title: "Reduce watering", event_type: "irrigation", dayOffset: 90, priority: "low", description: "Reduce irrigation as tubers mature" },
      { title: "Check harvest readiness", event_type: "general", dayOffset: 120, priority: "high", description: "Check leaves yellowing, test dig a tuber" },
      { title: "Harvest kaukau", event_type: "harvest", dayOffset: 150, priority: "high", description: "Harvest tubers carefully to avoid damage" },
    ],
  },
  {
    key: "taro",
    name: "Taro Growing Cycle",
    crop: "Taro",
    events: [
      { title: "Prepare wet beds", event_type: "general", dayOffset: 0, priority: "high", description: "Prepare waterlogged or marshy beds for taro" },
      { title: "Plant taro corms", event_type: "sowing", dayOffset: 3, priority: "high", description: "Plant taro corms 8-10cm deep, 60cm apart" },
      { title: "Initial flooding", event_type: "irrigation", dayOffset: 4, priority: "high", description: "Flood beds to 5cm above soil level" },
      { title: "First fertilizer", event_type: "fertilizer", dayOffset: 30, priority: "medium", description: "Apply nitrogen-rich fertilizer" },
      { title: "Pest inspection", event_type: "spraying", dayOffset: 45, priority: "medium", description: "Check for taro beetle and leaf blight" },
      { title: "Second fertilizer", event_type: "fertilizer", dayOffset: 75, priority: "medium", description: "Apply balanced NPK fertilizer" },
      { title: "Maintain water level", event_type: "irrigation", dayOffset: 90, priority: "medium", description: "Ensure consistent water levels" },
      { title: "Drain for harvest", event_type: "irrigation", dayOffset: 240, priority: "high", description: "Drain fields 2 weeks before harvest" },
      { title: "Harvest taro", event_type: "harvest", dayOffset: 270, priority: "high", description: "Harvest when leaves yellow and wilt" },
    ],
  },
  {
    key: "rice",
    name: "Rice Paddy Cycle",
    crop: "Rice",
    events: [
      { title: "Prepare nursery beds", event_type: "general", dayOffset: 0, priority: "high", description: "Prepare seedbed, soak and sow rice seeds" },
      { title: "Transplant seedlings", event_type: "sowing", dayOffset: 25, priority: "high", description: "Transplant 25-day old seedlings to main field" },
      { title: "First irrigation", event_type: "irrigation", dayOffset: 26, priority: "high", description: "Flood paddy to 5cm depth" },
      { title: "Basal fertilizer", event_type: "fertilizer", dayOffset: 28, priority: "high", description: "Apply NPK basal dose" },
      { title: "Weed management", event_type: "spraying", dayOffset: 35, priority: "medium", description: "Manual or chemical weed control" },
      { title: "Top dressing", event_type: "fertilizer", dayOffset: 50, priority: "medium", description: "Apply urea top dressing" },
      { title: "Pest monitoring", event_type: "spraying", dayOffset: 60, priority: "medium", description: "Check for stem borer and leaf folder" },
      { title: "Drain field", event_type: "irrigation", dayOffset: 100, priority: "high", description: "Drain field 2 weeks before harvest" },
      { title: "Harvest rice", event_type: "harvest", dayOffset: 120, priority: "high", description: "Harvest when 80% of grains are golden" },
    ],
  },
  {
    key: "maize",
    name: "Maize/Corn Cycle",
    crop: "Maize",
    events: [
      { title: "Land preparation", event_type: "general", dayOffset: 0, priority: "high", description: "Plough and harrow the field" },
      { title: "Sow maize seeds", event_type: "sowing", dayOffset: 3, priority: "high", description: "Sow seeds 5cm deep, 25cm spacing" },
      { title: "First irrigation", event_type: "irrigation", dayOffset: 4, priority: "high", description: "Water immediately after sowing" },
      { title: "Apply DAP fertilizer", event_type: "fertilizer", dayOffset: 14, priority: "high", description: "Apply DAP at 2-leaf stage" },
      { title: "Thinning", event_type: "general", dayOffset: 18, priority: "medium", description: "Thin to 1 plant per station" },
      { title: "First weeding", event_type: "spraying", dayOffset: 21, priority: "medium", description: "Remove weeds by hand or herbicide" },
      { title: "Top dress with CAN", event_type: "fertilizer", dayOffset: 35, priority: "high", description: "Apply CAN fertilizer at knee-height" },
      { title: "Second weeding", event_type: "spraying", dayOffset: 42, priority: "medium", description: "Second round of weed control" },
      { title: "Harvest maize", event_type: "harvest", dayOffset: 110, priority: "high", description: "Harvest when husks dry and kernels are hard" },
    ],
  },
];

export default function FarmCalendar() {
  const { user } = useAuth();
  const { copy } = useDashboardTranslations();
  const [events, setEvents] = useState<FarmEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [templateStartDate, setTemplateStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<CropTemplateKey | null>(null);
  const selectedTemplate = selectedTemplateKey
    ? CROP_TEMPLATES.find((t) => t.key === selectedTemplateKey) ?? null
    : null;
  const selectedTemplateLocalizedName = selectedTemplateKey
    ? (copy.farmCalendar.templates.cropNames as Record<string, string>)[selectedTemplateKey] ?? selectedTemplate?.name ?? ""
    : "";
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [templateStep, setTemplateStep] = useState<"choose" | "edit">("choose");
  const [editableTasks, setEditableTasks] = useState<Array<{
    title: string;
    event_type: string;
    priority: string;
    description: string;
    event_date: string;
    include: boolean;
  }>>([]);
  const [templatePlot, setTemplatePlot] = useState("");
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    event_type: "general",
    crop: "",
    plot_name: "",
    event_date: new Date().toISOString().split("T")[0],
    reminder_date: "",
    priority: "medium",
  });

  const eventTypes = [
    { value: "fertilizer", label: copy.common.eventTypes.fertilizer, icon: FlaskConical, color: "text-warning" },
    { value: "spraying", label: copy.common.eventTypes.spraying, icon: Bug, color: "text-destructive" },
    { value: "irrigation", label: copy.common.eventTypes.irrigation, icon: Droplets, color: "text-accent" },
    { value: "harvest", label: copy.common.eventTypes.harvest, icon: Wheat, color: "text-secondary" },
    { value: "sowing", label: copy.common.eventTypes.sowing, icon: Sprout, color: "text-success" },
    { value: "general", label: copy.common.eventTypes.general, icon: Calendar, color: "text-muted-foreground" },
  ];

  useEffect(() => {
    if (user) void fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("farm_events").select("*").order("event_date", { ascending: true });
    if (error) {
      console.error("Fetch events error:", error);
      toast({ variant: "destructive", title: copy.farmCalendar.errors.failedLoad });
    } else {
      setEvents(data || []);
    }
    setIsLoading(false);
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.event_date || !user) return;

    const { error } = await supabase.from("farm_events").insert({
      user_id: user.id,
      title: newEvent.title,
      description: newEvent.description || null,
      event_type: newEvent.event_type,
      crop: newEvent.crop || null,
      plot_name: newEvent.plot_name || null,
      event_date: newEvent.event_date,
      reminder_date: newEvent.reminder_date || null,
      priority: newEvent.priority,
    });

    if (error) {
      console.error("Add event error:", error);
      toast({ variant: "destructive", title: copy.farmCalendar.errors.failedAdd });
    } else {
      toast({ title: copy.farmCalendar.errors.added });
      setIsDialogOpen(false);
      setNewEvent({
        title: "", description: "", event_type: "general", crop: "", plot_name: "",
        event_date: new Date().toISOString().split("T")[0], reminder_date: "", priority: "medium",
      });
      void fetchEvents();
    }
  };

  const buildEditableTasks = (template: CropTemplate, startDateStr: string) => {
    const startDate = new Date(startDateStr);
    return template.events.map((e) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + e.dayOffset);
      return {
        title: e.title,
        event_type: e.event_type,
        priority: e.priority,
        description: e.description,
        event_date: d.toISOString().split("T")[0],
        include: true,
      };
    });
  };

  const handleSelectTemplate = (template: CropTemplate & { key: CropTemplateKey }) => {
    setSelectedTemplateKey(template.key);
    setEditableTasks(buildEditableTasks(template, templateStartDate));
  };

  const handleProceedToEdit = () => {
    if (!selectedTemplate) return;
    setEditableTasks(buildEditableTasks(selectedTemplate, templateStartDate));
    setTemplateStep("edit");
  };

  const updateTask = (index: number, patch: Partial<typeof editableTasks[number]>) => {
    setEditableTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  const removeTask = (index: number) => {
    setEditableTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const resetTemplateDialog = () => {
    setSelectedTemplateKey(null);
    setEditableTasks([]);
    setTemplateStep("choose");
    setTemplatePlot("");
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate || !user) return;
    const tasksToSave = editableTasks.filter((t) => t.include && t.title && t.event_date);
    if (tasksToSave.length === 0) {
      toast({ variant: "destructive", title: copy.farmCalendar.templates.noTasksSelected });
      return;
    }
    setIsApplyingTemplate(true);

    const eventsToInsert = tasksToSave.map((t) => ({
      user_id: user.id,
      title: t.title,
      description: t.description || null,
      event_type: t.event_type,
      crop: selectedTemplate.crop,
      plot_name: templatePlot || null,
      event_date: t.event_date,
      priority: t.priority,
    }));

    const { error } = await supabase.from("farm_events").insert(eventsToInsert);
    setIsApplyingTemplate(false);

    if (error) {
      console.error("Template error:", error);
      toast({ variant: "destructive", title: copy.farmCalendar.templates.failedApply });
    } else {
      toast({ title: formatDashboardText(copy.farmCalendar.templates.appliedSuccess, { name: selectedTemplateLocalizedName, count: eventsToInsert.length }) });
      setIsTemplateDialogOpen(false);
      resetTemplateDialog();
      void fetchEvents();
    }
  };

  const toggleComplete = async (id: string, current: boolean) => {
    const { error } = await supabase.from("farm_events").update({ is_completed: !current }).eq("id", id);
    if (!error) setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, is_completed: !current } : e)));
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from("farm_events").delete().eq("id", id);
    if (!error) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast({ title: copy.farmCalendar.errors.deleted });
    }
  };

  const getEventIcon = (type: string) => {
    const found = eventTypes.find((t) => t.value === type);
    if (!found) return <Calendar className="w-4 h-4" />;
    const Icon = found.icon;
    return <Icon className={`w-4 h-4 ${found.color}`} />;
  };

  const filteredEvents = filter === "all" ? events : events.filter((e) => e.event_type === filter);
  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingEvents = filteredEvents.filter((e) => !e.is_completed && e.event_date >= todayStr);
  const pastOrDone = filteredEvents.filter((e) => e.is_completed || e.event_date < todayStr);
  const urgentEvents = events.filter((e) => !e.is_completed && e.priority === "high" && e.event_date >= todayStr && e.event_date <= new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header title={copy.farmCalendar.title} subtitle={copy.farmCalendar.subtitle} />

        <main className="p-4 lg:p-6">
          {urgentEvents.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h3 className="font-semibold text-foreground">{formatDashboardText(copy.farmCalendar.urgentTasks, { count: urgentEvents.length })}</h3>
              </div>
              <div className="space-y-2">
                {urgentEvents.map((e) => (
                  <div key={e.id} className="flex items-center gap-2 text-sm text-foreground">
                    {getEventIcon(e.event_type)}
                    <span className="font-medium">{e.title}</span>
                    <span className="text-muted-foreground">— {new Date(e.event_date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{events.length}</p>
              <p className="text-sm text-muted-foreground">{copy.farmCalendar.totalEvents}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-success">{events.filter((e) => e.is_completed).length}</p>
              <p className="text-sm text-muted-foreground">{copy.farmCalendar.completed}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-warning">{upcomingEvents.length}</p>
              <p className="text-sm text-muted-foreground">{copy.farmCalendar.upcoming}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{urgentEvents.length}</p>
              <p className="text-sm text-muted-foreground">{copy.farmCalendar.urgent}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" /> {copy.farmCalendar.addEvent}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{copy.farmCalendar.addFarmEvent}</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>{copy.farmCalendar.labels.title}</Label>
                    <Input placeholder={copy.farmCalendar.placeholders.title} value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{copy.farmCalendar.labels.type}</Label>
                      <Select value={newEvent.event_type} onValueChange={(v) => setNewEvent({ ...newEvent, event_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{eventTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{copy.farmCalendar.labels.priority}</Label>
                      <Select value={newEvent.priority} onValueChange={(v) => setNewEvent({ ...newEvent, priority: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">{copy.common.priorities.low}</SelectItem>
                          <SelectItem value="medium">{copy.common.priorities.medium}</SelectItem>
                          <SelectItem value="high">{copy.common.priorities.high}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{copy.farmCalendar.labels.crop}</Label>
                      <Input placeholder={copy.farmCalendar.placeholders.crop} value={newEvent.crop} onChange={(e) => setNewEvent({ ...newEvent, crop: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{copy.farmCalendar.labels.plot}</Label>
                      <Input placeholder={copy.farmCalendar.placeholders.plot} value={newEvent.plot_name} onChange={(e) => setNewEvent({ ...newEvent, plot_name: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{copy.farmCalendar.labels.eventDate}</Label>
                    <Input type="date" value={newEvent.event_date} onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{copy.farmCalendar.labels.description}</Label>
                    <Textarea placeholder={copy.farmCalendar.placeholders.description} value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} rows={3} />
                  </div>
                  <Button className="w-full" onClick={handleAddEvent} disabled={!newEvent.title || !newEvent.event_date}>{copy.farmCalendar.buttons.submit}</Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Crop Lifecycle Templates */}
            <Dialog
              open={isTemplateDialogOpen}
              onOpenChange={(open) => {
                setIsTemplateDialogOpen(open);
                if (!open) resetTemplateDialog();
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline"><ListPlus className="w-4 h-4 mr-2" /> {copy.farmCalendar.templates.button}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {templateStep === "edit" && (
                      <button
                        type="button"
                        onClick={() => setTemplateStep("choose")}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={copy.farmCalendar.templates.back}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    )}
                    {templateStep === "choose"
                      ? copy.farmCalendar.templates.dialogTitle
                      : formatDashboardText(copy.farmCalendar.templates.reviewTitle, {
                          name: selectedTemplateLocalizedName,
                        })}
                  </DialogTitle>
                </DialogHeader>

                {templateStep === "choose" && (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      {copy.farmCalendar.templates.intro}
                    </p>
                    <div className="space-y-3">
                      {CROP_TEMPLATES.map((template) => {
                        const isSelected = selectedTemplateKey === template.key;
                        const counts = template.events.reduce<Record<string, number>>((acc, e) => {
                          acc[e.event_type] = (acc[e.event_type] || 0) + 1;
                          return acc;
                        }, {});
                        const localizedName = (copy.farmCalendar.templates.cropNames as Record<string, string>)[template.key] ?? template.name;
                        return (
                          <button
                            key={template.key}
                            onClick={() => handleSelectTemplate(template)}
                            aria-pressed={isSelected}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/40" : "border-border hover:border-primary/30"}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-foreground">{localizedName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDashboardText(copy.farmCalendar.templates.tasksCount, {
                                    count: template.events.length,
                                    days: template.events[template.events.length - 1].dayOffset,
                                  })}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                  {counts.irrigation && <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent">{formatDashboardText(copy.farmCalendar.templates.irrigationBadge, { count: counts.irrigation })}</span>}
                                  {counts.fertilizer && <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning">{formatDashboardText(copy.farmCalendar.templates.fertilizerBadge, { count: counts.fertilizer })}</span>}
                                  {counts.spraying && <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">{formatDashboardText(copy.farmCalendar.templates.sprayingBadge, { count: counts.spraying })}</span>}
                                  {counts.harvest && <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">{formatDashboardText(copy.farmCalendar.templates.harvestBadge, { count: counts.harvest })}</span>}
                                </div>
                              </div>
                              <Zap className={`w-5 h-5 flex-shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {selectedTemplate && (
                      <div className="mt-4 space-y-3 border-t border-border pt-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>{copy.farmCalendar.templates.startDate}</Label>
                            <Input
                              type="date"
                              value={templateStartDate}
                              onChange={(e) => {
                                setTemplateStartDate(e.target.value);
                                if (selectedTemplate) setEditableTasks(buildEditableTasks(selectedTemplate, e.target.value));
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{copy.farmCalendar.templates.plotOptional}</Label>
                            <Input placeholder={copy.farmCalendar.templates.plotPlaceholder} value={templatePlot} onChange={(e) => setTemplatePlot(e.target.value)} />
                          </div>
                        </div>
                        <Button className="w-full" onClick={handleProceedToEdit}>
                          {formatDashboardText(copy.farmCalendar.templates.proceed, { count: selectedTemplate.events.length })}
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {templateStep === "edit" && selectedTemplate && (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">
                      {copy.farmCalendar.templates.editIntro}
                    </p>
                    <div className="flex items-center justify-between mb-3 text-sm">
                      <span className="text-muted-foreground">
                        {formatDashboardText(copy.farmCalendar.templates.selectionSummary, {
                          selected: editableTasks.filter((t) => t.include).length,
                          total: editableTasks.length,
                        })}
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditableTasks((prev) => prev.map((t) => ({ ...t, include: true })))}>{copy.farmCalendar.templates.selectAll}</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditableTasks((prev) => prev.map((t) => ({ ...t, include: false })))}>{copy.farmCalendar.templates.selectNone}</Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {editableTasks.map((task, idx) => (
                        <div
                          key={idx}
                          className={`rounded-xl border p-3 transition-all ${task.include ? "border-border bg-card" : "border-dashed border-border/50 bg-muted/30 opacity-60"}`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={task.include}
                              onCheckedChange={(v) => updateTask(idx, { include: Boolean(v) })}
                              className="mt-1"
                            />
                            <div className="flex-1 space-y-2 min-w-0">
                              <div className="flex items-center gap-2">
                                {getEventIcon(task.event_type)}
                                <Input
                                  value={task.title}
                                  onChange={(e) => updateTask(idx, { title: e.target.value })}
                                  className="h-8 font-medium"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeTask(idx)}
                                  className="text-muted-foreground hover:text-destructive flex-shrink-0"
                                  aria-label={copy.farmCalendar.templates.removeTask}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <Label className="text-xs text-muted-foreground">{copy.farmCalendar.templates.taskDate}</Label>
                                  <Input
                                    type="date"
                                    value={task.event_date}
                                    onChange={(e) => updateTask(idx, { event_date: e.target.value })}
                                    className="h-8 text-xs"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">{copy.farmCalendar.templates.taskType}</Label>
                                  <Select value={task.event_type} onValueChange={(v) => updateTask(idx, { event_type: v })}>
                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {eventTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">{copy.farmCalendar.templates.taskPriority}</Label>
                                  <Select value={task.priority} onValueChange={(v) => updateTask(idx, { priority: v })}>
                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">{copy.common.priorities.low}</SelectItem>
                                      <SelectItem value="medium">{copy.common.priorities.medium}</SelectItem>
                                      <SelectItem value="high">{copy.common.priorities.high}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <Textarea
                                value={task.description}
                                onChange={(e) => updateTask(idx, { description: e.target.value })}
                                rows={2}
                                className="text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex gap-2 sticky bottom-0 bg-background pt-3 border-t border-border">
                      <Button variant="outline" onClick={() => setTemplateStep("choose")} className="flex-1">
                        {copy.farmCalendar.templates.back}
                      </Button>
                      <Button
                        onClick={handleApplyTemplate}
                        disabled={isApplyingTemplate || editableTasks.filter((t) => t.include).length === 0}
                        className="flex-1"
                      >
                        {isApplyingTemplate ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{copy.farmCalendar.templates.saving}</>
                        ) : (
                          <>{formatDashboardText(copy.farmCalendar.templates.saveTasks, { count: editableTasks.filter((t) => t.include).length })}</>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>

            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder={copy.farmCalendar.labels.filterPlaceholder} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{copy.common.listingTypes.all}</SelectItem>
                {eventTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
          ) : (
            <div className="space-y-6">
              {upcomingEvents.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">{copy.farmCalendar.upcoming}</h3>
                  <div className="space-y-3">
                    {upcomingEvents.map((event) => <EventCard key={event.id} event={event} onToggle={toggleComplete} onDelete={deleteEvent} getIcon={getEventIcon} overdueLabel={copy.farmCalendar.labels.overdue} />)}
                  </div>
                </div>
              )}

              {pastOrDone.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-muted-foreground mb-3">{copy.farmCalendar.labels.completedPast}</h3>
                  <div className="space-y-3">
                    {pastOrDone.map((event) => <EventCard key={event.id} event={event} onToggle={toggleComplete} onDelete={deleteEvent} getIcon={getEventIcon} overdueLabel={copy.farmCalendar.labels.overdue} />)}
                  </div>
                </div>
              )}

              {filteredEvents.length === 0 && (
                <div className="text-center py-16">
                  <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">{copy.farmCalendar.empty}</p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> {copy.farmCalendar.addEvent}</Button>
                    <Button variant="outline" onClick={() => setIsTemplateDialogOpen(true)}><ListPlus className="w-4 h-4 mr-2" /> {copy.farmCalendar.useTemplate}</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function EventCard({
  event,
  onToggle,
  onDelete,
  getIcon,
  overdueLabel,
}: {
  event: FarmEvent;
  onToggle: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  getIcon: (type: string) => JSX.Element;
  overdueLabel: string;
}) {
  const isOverdue = !event.is_completed && event.event_date < new Date().toISOString().split("T")[0];

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border-l-4 border border-border transition-all ${event.is_completed ? "opacity-60 border-l-muted" : priorityColors[event.priority] || ""} ${isOverdue ? "border-l-destructive" : ""}`}>
      <button onClick={() => onToggle(event.id, event.is_completed)} className="mt-0.5 flex-shrink-0">
        {event.is_completed ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {getIcon(event.event_type)}
          <h4 className={`font-medium text-foreground ${event.is_completed ? "line-through" : ""}`}>{event.title}</h4>
          {isOverdue && <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">{overdueLabel}</span>}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
          <span>{new Date(event.event_date).toLocaleDateString()}</span>
          {event.crop && <span>🌾 {event.crop}</span>}
          {event.plot_name && <span>📍 {event.plot_name}</span>}
        </div>
        {event.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>}
      </div>
      <button onClick={() => onDelete(event.id)} className="text-muted-foreground hover:text-destructive flex-shrink-0">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
