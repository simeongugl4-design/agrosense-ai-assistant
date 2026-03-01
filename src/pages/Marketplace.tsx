import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  ShoppingCart, Plus, MapPin, Phone, Tag, TrendingUp, Loader2,
  Search, Filter, Package, IndianRupee, Wheat, MessageCircle, Send, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  crop_type: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  location: string | null;
  listing_type: string;
  status: string;
  contact_phone: string | null;
  created_at: string;
  image_url: string | null;
}

interface ChatMessage {
  id: string;
  listing_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

const cropOptions = [
  "Wheat", "Rice", "Maize", "Cotton", "Sugarcane", "Potato", "Tomato",
  "Onion", "Soybean", "Groundnut", "Mustard", "Pulses", "Vegetables", "Fruits", "Other",
];

export default function Marketplace() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [tab, setTab] = useState<"browse" | "my">("browse");
  const [chatOpen, setChatOpen] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatName, setChatName] = useState(() => localStorage.getItem("agrosense_chat_name") || "");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [newListing, setNewListing] = useState({
    title: "", description: "", crop_type: "", quantity: "", unit: "kg",
    price_per_unit: "", location: "", listing_type: "sell", contact_phone: "",
  });

  useEffect(() => { fetchListings(); }, []);

  useEffect(() => {
    if (!chatOpen) return;
    // Load messages
    const load = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("listing_id", chatOpen)
        .order("created_at", { ascending: true });
      setChatMessages((data as ChatMessage[]) || []);
    };
    load();

    // Subscribe to realtime
    const channel = supabase
      .channel(`chat-${chatOpen}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `listing_id=eq.${chatOpen}` },
        (payload) => {
          setChatMessages(prev => [...prev, payload.new as ChatMessage]);
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chatOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const fetchListings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("marketplace_listings").select("*").order("created_at", { ascending: false });
    if (!error) setListings(data || []);
    setIsLoading(false);
  };

  const handleCreateListing = async () => {
    if (!newListing.title || !newListing.crop_type || !newListing.quantity || !newListing.price_per_unit) {
      toast({ variant: "destructive", title: "Please fill all required fields" });
      return;
    }
    // Use a guest ID if not logged in
    const userId = user?.id || `guest-${Date.now()}`;
    const { error } = await supabase.from("marketplace_listings").insert({
      user_id: userId,
      title: newListing.title,
      description: newListing.description || null,
      crop_type: newListing.crop_type,
      quantity: parseFloat(newListing.quantity),
      unit: newListing.unit,
      price_per_unit: parseFloat(newListing.price_per_unit),
      location: newListing.location || null,
      listing_type: newListing.listing_type,
      contact_phone: newListing.contact_phone || null,
    });
    if (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Failed to create listing", description: error.message });
    } else {
      toast({ title: "Listing created! 🛒" });
      setIsDialogOpen(false);
      setNewListing({ title: "", description: "", crop_type: "", quantity: "", unit: "kg", price_per_unit: "", location: "", listing_type: "sell", contact_phone: "" });
      fetchListings();
    }
  };

  const handleMarkSold = async (id: string) => {
    const { error } = await supabase.from("marketplace_listings").update({ status: "sold" }).eq("id", id);
    if (!error) { setListings(prev => prev.map(l => l.id === id ? { ...l, status: "sold" } : l)); toast({ title: "Marked as sold! ✅" }); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("marketplace_listings").delete().eq("id", id);
    if (!error) { setListings(prev => prev.filter(l => l.id !== id)); toast({ title: "Listing deleted" }); }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !chatOpen) return;
    const name = chatName || "Anonymous Farmer";
    if (chatName) localStorage.setItem("agrosense_chat_name", chatName);
    const senderId = user?.id || `guest-${localStorage.getItem("agrosense_guest_id") || (() => { const id = Date.now().toString(); localStorage.setItem("agrosense_guest_id", id); return id; })()}`;

    await supabase.from("chat_messages").insert({
      listing_id: chatOpen,
      sender_id: senderId,
      sender_name: name,
      message: chatInput.trim(),
    });
    setChatInput("");
  };

  const displayedListings = listings.filter(l => {
    if (tab === "my") return l.user_id === user?.id;
    const matchesSearch = !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase()) || l.crop_type.toLowerCase().includes(searchQuery.toLowerCase()) || (l.location || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || l.listing_type === typeFilter;
    return matchesSearch && matchesType && l.status === "active";
  });

  const chatListing = listings.find(l => l.id === chatOpen);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header title="Marketplace" subtitle="Buy and sell farm produce — connect with farmers and buyers" />
        <main className="p-4 lg:p-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{listings.filter(l => l.status === "active").length}</p>
              <p className="text-sm text-muted-foreground">Active Listings</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-success">{listings.filter(l => l.listing_type === "sell").length}</p>
              <p className="text-sm text-muted-foreground">For Sale</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-accent">{listings.filter(l => l.listing_type === "buy").length}</p>
              <p className="text-sm text-muted-foreground">Buy Requests</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-secondary">{listings.filter(l => l.user_id === user?.id).length}</p>
              <p className="text-sm text-muted-foreground">My Listings</p>
            </div>
          </div>

          {/* Tabs + Actions */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex bg-muted rounded-lg p-1">
              <button onClick={() => setTab("browse")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "browse" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>Browse All</button>
              <button onClick={() => setTab("my")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "my" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>My Listings</button>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> New Listing</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Create Listing</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Listing Type</Label>
                    <Select value={newListing.listing_type} onValueChange={v => setNewListing({ ...newListing, listing_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sell">I want to Sell</SelectItem>
                        <SelectItem value="buy">I want to Buy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Title *</Label><Input placeholder="e.g., Fresh organic wheat - 50 quintal" value={newListing.title} onChange={e => setNewListing({ ...newListing, title: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>Crop Type *</Label>
                    <Select value={newListing.crop_type} onValueChange={v => setNewListing({ ...newListing, crop_type: v })}>
                      <SelectTrigger><SelectValue placeholder="Select crop" /></SelectTrigger>
                      <SelectContent>{cropOptions.map(c => <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2"><Label>Quantity *</Label><Input type="number" placeholder="50" value={newListing.quantity} onChange={e => setNewListing({ ...newListing, quantity: e.target.value })} /></div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Select value={newListing.unit} onValueChange={v => setNewListing({ ...newListing, unit: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">Kg</SelectItem>
                          <SelectItem value="quintal">Quintal</SelectItem>
                          <SelectItem value="ton">Ton</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Price/Unit *</Label><Input type="number" placeholder="₹2500" value={newListing.price_per_unit} onChange={e => setNewListing({ ...newListing, price_per_unit: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Location</Label><Input placeholder="e.g., Ludhiana, Punjab" value={newListing.location} onChange={e => setNewListing({ ...newListing, location: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Contact Phone</Label><Input placeholder="+91 XXXXX XXXXX" value={newListing.contact_phone} onChange={e => setNewListing({ ...newListing, contact_phone: e.target.value })} /></div>
                  </div>
                  <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Quality details, delivery info..." value={newListing.description} rows={3} onChange={e => setNewListing({ ...newListing, description: e.target.value })} /></div>
                  <Button className="w-full" onClick={handleCreateListing} disabled={!newListing.title || !newListing.crop_type || !newListing.quantity || !newListing.price_per_unit}>Create Listing</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search & Filter */}
          {tab === "browse" && (
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search crops, locations..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sell">For Sale</SelectItem>
                  <SelectItem value="buy">Buy Requests</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Listings Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
          ) : displayedListings.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedListings.map(listing => (
                <div key={listing.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${listing.listing_type === "sell" ? "bg-success/10" : "bg-accent/10"}`}>
                        {listing.listing_type === "sell" ? <TrendingUp className="w-5 h-5 text-success" /> : <ShoppingCart className="w-5 h-5 text-accent" />}
                      </div>
                      <Badge variant={listing.listing_type === "sell" ? "default" : "secondary"} className="text-xs">
                        {listing.listing_type === "sell" ? "Selling" : "Buying"}
                      </Badge>
                    </div>
                    {listing.status === "sold" && <Badge variant="outline" className="text-muted-foreground">Sold</Badge>}
                  </div>
                  <h4 className="font-semibold text-foreground mb-2 line-clamp-1">{listing.title}</h4>
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm"><Wheat className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground">Crop:</span><span className="font-medium text-foreground capitalize">{listing.crop_type}</span></div>
                    <div className="flex items-center gap-2 text-sm"><Package className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground">Qty:</span><span className="font-medium text-foreground">{listing.quantity} {listing.unit}</span></div>
                    <div className="flex items-center gap-2 text-sm"><Tag className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground">Price:</span><span className="font-bold text-success">₹{listing.price_per_unit}/{listing.unit}</span></div>
                    {listing.location && <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground truncate">{listing.location}</span></div>}
                  </div>
                  {listing.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{listing.description}</p>}
                  {listing.contact_phone && (
                    <div className="flex items-center gap-2 text-sm mb-3 text-primary"><Phone className="w-4 h-4" /><a href={`tel:${listing.contact_phone}`}>{listing.contact_phone}</a></div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">{new Date(listing.created_at).toLocaleDateString()}</span>
                    <div className="flex gap-2">
                      {/* Chat button */}
                      <Button size="sm" variant="outline" onClick={() => setChatOpen(listing.id)}>
                        <MessageCircle className="w-3 h-3 mr-1" /> Chat
                      </Button>
                      {listing.user_id === user?.id && listing.status === "active" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleMarkSold(listing.id)}>Sold</Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(listing.id)}>Delete</Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">{tab === "my" ? "You haven't created any listings yet." : "No listings found."}</p>
            </div>
          )}

          {/* Chat Drawer */}
          {chatOpen && (
            <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
              <div className="absolute inset-0 bg-black/50" onClick={() => setChatOpen(null)} />
              <div className="relative w-full max-w-lg bg-card rounded-t-2xl lg:rounded-2xl border border-border shadow-xl flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2"><MessageCircle className="w-4 h-4 text-primary" /> Chat</h3>
                    {chatListing && <p className="text-xs text-muted-foreground truncate">{chatListing.title}</p>}
                  </div>
                  <button onClick={() => setChatOpen(null)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
                </div>
                {/* Name input */}
                {!chatName && (
                  <div className="p-4 border-b border-border bg-muted/50">
                    <Label className="text-xs">Enter your name to chat</Label>
                    <div className="flex gap-2 mt-1">
                      <Input placeholder="Your name" value={chatName} onChange={e => setChatName(e.target.value)} className="flex-1" />
                      <Button size="sm" onClick={() => { if (chatName) localStorage.setItem("agrosense_chat_name", chatName); }}>Set</Button>
                    </div>
                  </div>
                )}
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
                  {chatMessages.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Start the conversation!</p>
                  )}
                  {chatMessages.map(msg => {
                    const isMe = msg.sender_id === (user?.id || `guest-${localStorage.getItem("agrosense_guest_id")}`);
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"}`}>
                          {!isMe && <p className="text-xs font-semibold mb-1 opacity-70">{msg.sender_name}</p>}
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-[10px] opacity-50 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
                {/* Input */}
                <div className="p-3 border-t border-border flex gap-2">
                  <Input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..." className="flex-1" onKeyPress={e => e.key === "Enter" && handleSendChat()} />
                  <Button onClick={handleSendChat} disabled={!chatInput.trim()}><Send className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
