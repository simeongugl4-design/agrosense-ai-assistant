import { useState, useEffect } from "react";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

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

const eventTypes = [
  { value: "fertilizer", label: "Fertilizer", icon: FlaskConical, color: "text-warning" },
  { value: "spraying", label: "Spraying", icon: Bug, color: "text-destructive" },
  { value: "irrigation", label: "Irrigation", icon: Droplets, color: "text-accent" },
  { value: "harvest", label: "Harvest", icon: Wheat, color: "text-secondary" },
  { value: "sowing", label: "Sowing", icon: Sprout, color: "text-success" },
  { value: "general", label: "General", icon: Calendar, color: "text-muted-foreground" },
];

const priorityColors: Record<string, string> = {
  high: "border-l-destructive bg-destructive/5",
  medium: "border-l-warning bg-warning/5",
  low: "border-l-success bg-success/5",
};

export default function FarmCalendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState<FarmEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
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

  useEffect(() => {
    if (user) fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("farm_events")
      .select("*")
      .order("event_date", { ascending: true });

    if (error) {
      console.error("Fetch events error:", error);
      toast({ variant: "destructive", title: "Failed to load events" });
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
      toast({ variant: "destructive", title: "Failed to add event" });
    } else {
      toast({ title: "Event added! 🌱" });
      setIsDialogOpen(false);
      setNewEvent({
        title: "",
        description: "",
        event_type: "general",
        crop: "",
        plot_name: "",
        event_date: new Date().toISOString().split("T")[0],
        reminder_date: "",
        priority: "medium",
      });
      fetchEvents();
    }
  };

  const toggleComplete = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("farm_events")
      .update({ is_completed: !current })
      .eq("id", id);

    if (!error) {
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, is_completed: !current } : e))
      );
    }
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from("farm_events").delete().eq("id", id);
    if (!error) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast({ title: "Event deleted" });
    }
  };

  const getEventIcon = (type: string) => {
    const found = eventTypes.find((t) => t.value === type);
    if (!found) return <Calendar className="w-4 h-4" />;
    const Icon = found.icon;
    return <Icon className={`w-4 h-4 ${found.color}`} />;
  };

  const filteredEvents =
    filter === "all" ? events : events.filter((e) => e.event_type === filter);

  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingEvents = filteredEvents.filter(
    (e) => !e.is_completed && e.event_date >= todayStr
  );
  const pastOrDone = filteredEvents.filter(
    (e) => e.is_completed || e.event_date < todayStr
  );
  const urgentEvents = events.filter(
    (e) =>
      !e.is_completed &&
      e.priority === "high" &&
      e.event_date >= todayStr &&
      e.event_date <=
        new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0]
  );

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header
          title="Farm Calendar"
          subtitle="Track your farming activities and never miss a deadline"
        />

        <main className="p-4 lg:p-6">
          {/* Urgent Alerts */}
          {urgentEvents.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h3 className="font-semibold text-foreground">
                  Urgent Tasks ({urgentEvents.length})
                </h3>
              </div>
              <div className="space-y-2">
                {urgentEvents.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    {getEventIcon(e.event_type)}
                    <span className="font-medium">{e.title}</span>
                    <span className="text-muted-foreground">
                      — {new Date(e.event_date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{events.length}</p>
              <p className="text-sm text-muted-foreground">Total Events</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-success">
                {events.filter((e) => e.is_completed).length}
              </p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-warning">
                {upcomingEvents.length}
              </p>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-destructive">
                {urgentEvents.length}
              </p>
              <p className="text-sm text-muted-foreground">Urgent</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> Add Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Farm Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      placeholder="e.g., Apply urea to wheat plot"
                      value={newEvent.title}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={newEvent.event_type}
                        onValueChange={(v) =>
                          setNewEvent({ ...newEvent, event_type: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {eventTypes.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select
                        value={newEvent.priority}
                        onValueChange={(v) =>
                          setNewEvent({ ...newEvent, priority: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Crop</Label>
                      <Input
                        placeholder="e.g., Wheat"
                        value={newEvent.crop}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, crop: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Plot</Label>
                      <Input
                        placeholder="e.g., North Field"
                        value={newEvent.plot_name}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, plot_name: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Event Date *</Label>
                    <Input
                      type="date"
                      value={newEvent.event_date}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, event_date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Additional notes..."
                      value={newEvent.description}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, description: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleAddEvent}
                    disabled={!newEvent.title || !newEvent.event_date}
                  >
                    Add Event
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {eventTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Events List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Upcoming */}
              {upcomingEvents.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    Upcoming
                  </h3>
                  <div className="space-y-3">
                    {upcomingEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onToggle={toggleComplete}
                        onDelete={deleteEvent}
                        getIcon={getEventIcon}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed / Past */}
              {pastOrDone.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-muted-foreground mb-3">
                    Completed / Past
                  </h3>
                  <div className="space-y-3">
                    {pastOrDone.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onToggle={toggleComplete}
                        onDelete={deleteEvent}
                        getIcon={getEventIcon}
                      />
                    ))}
                  </div>
                </div>
              )}

              {filteredEvents.length === 0 && (
                <div className="text-center py-16">
                  <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No events yet. Add your first farming activity!
                  </p>
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
}: {
  event: FarmEvent;
  onToggle: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  getIcon: (type: string) => JSX.Element;
}) {
  const isOverdue =
    !event.is_completed &&
    event.event_date < new Date().toISOString().split("T")[0];

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border-l-4 border border-border transition-all ${
        event.is_completed
          ? "opacity-60 border-l-muted"
          : priorityColors[event.priority] || ""
      } ${isOverdue ? "border-l-destructive" : ""}`}
    >
      <button
        onClick={() => onToggle(event.id, event.is_completed)}
        className="mt-0.5 flex-shrink-0"
      >
        {event.is_completed ? (
          <CheckCircle2 className="w-5 h-5 text-success" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {getIcon(event.event_type)}
          <h4
            className={`font-medium text-foreground ${
              event.is_completed ? "line-through" : ""
            }`}
          >
            {event.title}
          </h4>
          {isOverdue && (
            <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
              Overdue
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
          <span>{new Date(event.event_date).toLocaleDateString()}</span>
          {event.crop && <span>🌾 {event.crop}</span>}
          {event.plot_name && <span>📍 {event.plot_name}</span>}
        </div>
        {event.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {event.description}
          </p>
        )}
      </div>
      <button
        onClick={() => onDelete(event.id)}
        className="text-muted-foreground hover:text-destructive flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
