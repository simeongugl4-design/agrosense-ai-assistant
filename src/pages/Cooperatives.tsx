import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Plus, MapPin, Sprout, Loader2, LogIn, LogOut, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getGuestId, getGuestName, setGuestName } from "@/lib/guest-id";

interface Group {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  location: string | null;
  primary_crop: string | null;
  member_count: number;
  created_at: string;
}

interface Membership {
  group_id: string;
}

export default function Cooperatives() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [myMemberships, setMyMemberships] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    location: "",
    primary_crop: "",
    owner_name: getGuestName(),
  });

  const guestId = getGuestId();

  const fetchAll = async () => {
    setIsLoading(true);
    const [{ data: g }, { data: m }] = await Promise.all([
      supabase.from("cooperative_groups").select("*").order("created_at", { ascending: false }),
      supabase.from("cooperative_members").select("group_id").eq("member_id", guestId),
    ]);
    if (g) setGroups(g as Group[]);
    if (m) setMyMemberships(new Set((m as Membership[]).map((x) => x.group_id)));
    setIsLoading(false);
  };

  useEffect(() => {
    void fetchAll();
  }, []);

  const handleCreate = async () => {
    if (!draft.name.trim()) {
      toast({ variant: "destructive", title: "Group name required" });
      return;
    }
    setSubmitting(true);
    setGuestName(draft.owner_name);
    const ownerName = draft.owner_name.trim() || "Anonymous Farmer";
    const { data, error } = await supabase
      .from("cooperative_groups")
      .insert({
        owner_id: guestId,
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        location: draft.location.trim() || null,
        primary_crop: draft.primary_crop.trim() || null,
      })
      .select()
      .single();

    if (error || !data) {
      setSubmitting(false);
      toast({ variant: "destructive", title: "Failed to create group" });
      return;
    }

    await supabase.from("cooperative_members").insert({
      group_id: (data as Group).id,
      member_id: guestId,
      member_name: ownerName,
      role: "owner",
    });

    setSubmitting(false);
    toast({ title: "Cooperative created 🌾" });
    setDraft({ name: "", description: "", location: "", primary_crop: "", owner_name: ownerName });
    setIsOpen(false);
    void fetchAll();
  };

  const handleJoin = async (group: Group) => {
    const { error } = await supabase.from("cooperative_members").insert({
      group_id: group.id,
      member_id: guestId,
      member_name: getGuestName(),
      role: "member",
    });
    if (error) {
      toast({ variant: "destructive", title: "Could not join" });
      return;
    }
    await supabase
      .from("cooperative_groups")
      .update({ member_count: group.member_count + 1 })
      .eq("id", group.id);
    toast({ title: `Joined ${group.name}` });
    void fetchAll();
  };

  const handleLeave = async (group: Group) => {
    if (group.owner_id === guestId) {
      toast({ variant: "destructive", title: "Owners cannot leave their own group" });
      return;
    }
    const { error } = await supabase
      .from("cooperative_members")
      .delete()
      .eq("group_id", group.id)
      .eq("member_id", guestId);
    if (error) {
      toast({ variant: "destructive", title: "Could not leave" });
      return;
    }
    await supabase
      .from("cooperative_groups")
      .update({ member_count: Math.max(1, group.member_count - 1) })
      .eq("id", group.id);
    toast({ title: `Left ${group.name}` });
    void fetchAll();
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header title="Cooperatives" subtitle="Join or create farmer groups to share resources" />
        <main className="p-4 lg:p-6 max-w-5xl mx-auto">
          <div className="flex justify-end mb-6">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" /> New cooperative</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create a cooperative</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Your name</Label>
                    <Input value={draft.owner_name} onChange={(e) => setDraft({ ...draft, owner_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Group name</Label>
                    <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Mt Hagen Kaukau Co-op" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Location</Label>
                      <Input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="Western Highlands" />
                    </div>
                    <div>
                      <Label>Primary crop</Label>
                      <Input value={draft.primary_crop} onChange={(e) => setDraft({ ...draft, primary_crop: e.target.value })} placeholder="Kaukau" />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="What does this group do?" />
                  </div>
                  <Button onClick={handleCreate} disabled={submitting} className="w-full">
                    {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</> : "Create"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : groups.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground">No cooperatives yet — start the first one!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {groups.map((group) => {
                const isMember = myMemberships.has(group.id);
                const isOwner = group.owner_id === guestId;
                return (
                  <div key={group.id} className="bg-card border border-border rounded-xl p-5 flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        {group.name}
                        {isOwner && <Crown className="w-4 h-4 text-warning" aria-label="Owner" />}
                      </h3>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" /> {group.member_count}
                      </span>
                    </div>
                    {group.description && <p className="text-sm text-muted-foreground mb-3">{group.description}</p>}
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-4">
                      {group.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{group.location}</span>}
                      {group.primary_crop && <span className="flex items-center gap-1"><Sprout className="w-3 h-3" />{group.primary_crop}</span>}
                    </div>
                    <div className="mt-auto">
                      {isMember ? (
                        <Button variant="outline" className="w-full" onClick={() => handleLeave(group)} disabled={isOwner}>
                          <LogOut className="w-4 h-4 mr-2" /> {isOwner ? "Owner" : "Leave"}
                        </Button>
                      ) : (
                        <Button className="w-full" onClick={() => handleJoin(group)}>
                          <LogIn className="w-4 h-4 mr-2" /> Join
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
