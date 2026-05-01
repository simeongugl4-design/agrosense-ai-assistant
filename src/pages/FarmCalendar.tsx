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
} from "lucide-react";
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

const CROP_TEMPLATES: CropTemplate[] = [
  {
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
  const [selectedTemplate, setSelectedTemplate] = useState<CropTemplate | null>(null);
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

  const handleApplyTemplate = async () => {
    if (!selectedTemplate || !user || !templateStartDate) return;
    setIsApplyingTemplate(true);

    const startDate = new Date(templateStartDate);
    const eventsToInsert = selectedTemplate.events.map((e) => {
      const eventDate = new Date(startDate);
      eventDate.setDate(eventDate.getDate() + e.dayOffset);
      return {
        user_id: user.id,
        title: e.title,
        description: e.description,
        event_type: e.event_type,
        crop: selectedTemplate.crop,
        event_date: eventDate.toISOString().split("T")[0],
        priority: e.priority,
      };
    });

    const { error } = await supabase.from("farm_events").insert(eventsToInsert);
    setIsApplyingTemplate(false);

    if (error) {
      console.error("Template error:", error);
      toast({ variant: "destructive", title: "Failed to apply template" });
    } else {
      toast({ title: `${selectedTemplate.name} applied — ${eventsToInsert.length} events created!` });
      setIsTemplateDialogOpen(false);
      setSelectedTemplate(null);
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
            <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><ListPlus className="w-4 h-4 mr-2" /> Crop Templates</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Crop Lifecycle Templates</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground mb-4">Auto-generate a complete farming schedule for a crop cycle. Select a template and start date.</p>
                <div className="space-y-3">
                  {CROP_TEMPLATES.map((template) => (
                    <button
                      key={template.name}
                      onClick={() => setSelectedTemplate(selectedTemplate?.name === template.name ? null : template)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${selectedTemplate?.name === template.name ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{template.name}</p>
                          <p className="text-xs text-muted-foreground">{template.events.length} tasks • ~{template.events[template.events.length - 1].dayOffset} days</p>
                        </div>
                        <Zap className={`w-5 h-5 ${selectedTemplate?.name === template.name ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      {selectedTemplate?.name === template.name && (
                        <div className="mt-3 space-y-1 border-t border-border pt-3">
                          {template.events.map((e, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className={`w-1.5 h-1.5 rounded-full ${e.priority === "high" ? "bg-destructive" : e.priority === "medium" ? "bg-warning" : "bg-success"}`} />
                              <span>Day {e.dayOffset}:</span>
                              <span className="text-foreground">{e.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                {selectedTemplate && (
                  <div className="mt-4 space-y-3 border-t border-border pt-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" value={templateStartDate} onChange={(e) => setTemplateStartDate(e.target.value)} />
                    </div>
                    <Button className="w-full" onClick={handleApplyTemplate} disabled={isApplyingTemplate}>
                      {isApplyingTemplate ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Applying...</> : <>Apply {selectedTemplate.name}</>}
                    </Button>
                  </div>
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
                    <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Event</Button>
                    <Button variant="outline" onClick={() => setIsTemplateDialogOpen(true)}><ListPlus className="w-4 h-4 mr-2" /> Use Template</Button>
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
