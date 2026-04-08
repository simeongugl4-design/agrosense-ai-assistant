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
  Search, Filter, Package, Wheat, MessageCircle, Send, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useDashboardTranslations } from "@/hooks/useDashboardTranslations";

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

function getGuestId() {
  let id = localStorage.getItem("agrosense_guest_id");
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)) {
    id = crypto.randomUUID();
    localStorage.setItem("agrosense_guest_id", id);
  }
  return id;
}

export default function Marketplace() {
  const { user } = useAuth();
  const { copy } = useDashboardTranslations();
  const cropOptions = [
    { value: "wheat", label: copy.common.cropOptions.wheat },
    { value: "rice", label: copy.common.cropOptions.rice },
    { value: "maize", label: copy.common.cropOptions.maize },
    { value: "cotton", label: copy.common.cropOptions.cotton },
    { value: "sugarcane", label: copy.common.cropOptions.sugarcane },
    { value: "potato", label: copy.common.cropOptions.potato },
    { value: "tomato", label: copy.common.cropOptions.tomato },
    { value: "onion", label: copy.common.cropOptions.onion },
    { value: "soybean", label: copy.common.cropOptions.soybean },
    { value: "groundnut", label: copy.common.cropOptions.groundnut },
    { value: "mustard", label: copy.common.cropOptions.mustard },
    { value: "pulses", label: copy.common.cropOptions.pulses },
    { value: "vegetables", label: copy.common.cropOptions.vegetables },
    { value: "fruits", label: copy.common.cropOptions.fruits },
    { value: "coffee", label: copy.common.cropOptions.coffee },
    { value: "tea", label: copy.common.cropOptions.tea },
    { value: "cocoa", label: copy.common.cropOptions.cocoa },
    { value: "cassava", label: copy.common.cropOptions.cassava },
    { value: "kaukau", label: copy.common.cropOptions.kaukau },
    { value: "taro", label: copy.common.cropOptions.taro },
    { value: "millet", label: copy.common.cropOptions.millet },
    { value: "sorghum", label: copy.common.cropOptions.sorghum },
    { value: "other", label: copy.common.cropOptions.other },
  ];
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
  const [nameSet, setNameSet] = useState(() => !!localStorage.getItem("agrosense_chat_name"));
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [newListing, setNewListing] = useState({
    title: "", description: "", crop_type: "", quantity: "50", unit: "kg",
    price_per_unit: "100", location: "", listing_type: "sell", contact_phone: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => { void fetchListings(); }, []);

  useEffect(() => {
    if (!chatOpen) return;
    const load = async () => {
      const { data } = await supabase.from("chat_messages").select("*").eq("listing_id", chatOpen).order("created_at", { ascending: true });
      setChatMessages((data as ChatMessage[]) || []);
    };
    void load();

    const channel = supabase.channel(`chat-${chatOpen}`).on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages", filter: `listing_id=eq.${chatOpen}` },
      (payload) => setChatMessages((prev) => [...prev, payload.new as ChatMessage]),
    ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chatOpen]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const fetchListings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("marketplace_listings").select("*").order("created_at", { ascending: false });
    if (error) console.error("Fetch listings error:", error);
    if (!error) setListings(data || []);
    setIsLoading(false);
  };

  const handleCreateListing = async () => {
    if (!newListing.title || !newListing.crop_type || !newListing.quantity || !newListing.price_per_unit) {
      toast({ variant: "destructive", title: copy.marketplace.errors.fillRequired });
      return;
    }
    setIsCreating(true);
    const userId = user?.id || getGuestId();
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
    setIsCreating(false);
    if (error) {
      console.error(error);
      toast({ variant: "destructive", title: copy.marketplace.errors.failedCreate, description: error.message });
    } else {
      toast({ title: copy.marketplace.errors.created });
      setIsDialogOpen(false);
      setNewListing({ title: "", description: "", crop_type: "", quantity: "50", unit: "kg", price_per_unit: "100", location: "", listing_type: "sell", contact_phone: "" });
      void fetchListings();
    }
  };

  const handleMarkSold = async (id: string) => {
    const { error } = await supabase.from("marketplace_listings").update({ status: "sold" }).eq("id", id);
    if (!error) {
      setListings((prev) => prev.map((l) => l.id === id ? { ...l, status: "sold" } : l));
      toast({ title: copy.marketplace.errors.markedSold });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("marketplace_listings").delete().eq("id", id);
    if (!error) {
      setListings((prev) => prev.filter((l) => l.id !== id));
      toast({ title: copy.marketplace.errors.deleted });
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !chatOpen) return;
    if (!nameSet || !chatName.trim()) {
      toast({ variant: "destructive", title: copy.marketplace.errors.enterNameFirst });
      return;
    }
    const senderId = user?.id || getGuestId();
    const { error } = await supabase.from("chat_messages").insert({
      listing_id: chatOpen,
      sender_id: senderId,
      sender_name: chatName.trim(),
      message: chatInput.trim(),
    });
    if (error) {
      console.error("Chat error:", error);
      toast({ variant: "destructive", title: copy.marketplace.errors.failedSend });
    } else {
      setChatInput("");
    }
  };

  const handleSetName = () => {
    if (chatName.trim()) {
      localStorage.setItem("agrosense_chat_name", chatName.trim());
      setNameSet(true);
    }
  };

  const myId = user?.id || getGuestId();
  const displayedListings = listings.filter((l) => {
    if (tab === "my") return l.user_id === myId;
    const matchesSearch = !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase()) || l.crop_type.toLowerCase().includes(searchQuery.toLowerCase()) || (l.location || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || l.listing_type === typeFilter;
    return matchesSearch && matchesType && l.status === "active";
  });

  const chatListing = listings.find((l) => l.id === chatOpen);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header title={copy.marketplace.title} subtitle={copy.marketplace.subtitle} />
        <main className="p-4 lg:p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{listings.filter((l) => l.status === "active").length}</p>
              <p className="text-sm text-muted-foreground">{copy.marketplace.stats.activeListings}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-success">{listings.filter((l) => l.listing_type === "sell").length}</p>
              <p className="text-sm text-muted-foreground">{copy.marketplace.stats.forSale}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-accent">{listings.filter((l) => l.listing_type === "buy").length}</p>
              <p className="text-sm text-muted-foreground">{copy.marketplace.stats.buyRequests}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-secondary">{listings.filter((l) => l.user_id === myId).length}</p>
              <p className="text-sm text-muted-foreground">{copy.marketplace.stats.myListings}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex bg-muted rounded-lg p-1">
              <button onClick={() => setTab("browse")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "browse" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{copy.marketplace.tabs.browse}</button>
              <button onClick={() => setTab("my")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "my" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{copy.marketplace.tabs.my}</button>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> {copy.marketplace.newListing}</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{copy.marketplace.createListing}</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>{copy.marketplace.labels.listingType}</Label>
                    <Select value={newListing.listing_type} onValueChange={(v) => setNewListing({ ...newListing, listing_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sell">{copy.marketplace.options.sell}</SelectItem>
                        <SelectItem value="buy">{copy.marketplace.options.buy}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>{copy.marketplace.labels.title}</Label><Input placeholder={copy.marketplace.placeholders.title} value={newListing.title} onChange={(e) => setNewListing({ ...newListing, title: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>{copy.marketplace.labels.cropType}</Label>
                    <Select value={newListing.crop_type} onValueChange={(v) => setNewListing({ ...newListing, crop_type: v })}>
                      <SelectTrigger><SelectValue placeholder={copy.marketplace.placeholders.cropType} /></SelectTrigger>
                      <SelectContent>{cropOptions.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2"><Label>{copy.marketplace.labels.quantity}</Label><Input type="number" placeholder={copy.marketplace.placeholders.quantity} value={newListing.quantity} onChange={(e) => setNewListing({ ...newListing, quantity: e.target.value })} /></div>
                    <div className="space-y-2">
                      <Label>{copy.marketplace.labels.unit}</Label>
                      <Select value={newListing.unit} onValueChange={(v) => setNewListing({ ...newListing, unit: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">{copy.common.units.kg}</SelectItem>
                          <SelectItem value="quintal">{copy.common.units.quintal}</SelectItem>
                          <SelectItem value="ton">{copy.common.units.ton}</SelectItem>
                          <SelectItem value="bag">{copy.common.units.bag}</SelectItem>
                          <SelectItem value="crate">{copy.common.units.crate}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>{copy.marketplace.labels.pricePerUnit}</Label><Input type="number" placeholder={copy.marketplace.placeholders.pricePerUnit} value={newListing.price_per_unit} onChange={(e) => setNewListing({ ...newListing, price_per_unit: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>{copy.marketplace.labels.location}</Label><Input placeholder={copy.marketplace.placeholders.location} value={newListing.location} onChange={(e) => setNewListing({ ...newListing, location: e.target.value })} /></div>
                    <div className="space-y-2"><Label>{copy.marketplace.labels.contactPhone}</Label><Input placeholder={copy.marketplace.placeholders.contactPhone} value={newListing.contact_phone} onChange={(e) => setNewListing({ ...newListing, contact_phone: e.target.value })} /></div>
                  </div>
                  <div className="space-y-2"><Label>{copy.marketplace.labels.description}</Label><Textarea placeholder={copy.marketplace.placeholders.description} value={newListing.description} rows={3} onChange={(e) => setNewListing({ ...newListing, description: e.target.value })} /></div>
                  <Button className="w-full" onClick={handleCreateListing} disabled={isCreating || !newListing.title || !newListing.crop_type || !newListing.quantity || !newListing.price_per_unit}>
                    {isCreating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{copy.marketplace.buttons.loading}</> : copy.marketplace.buttons.submit}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {tab === "browse" && (
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder={copy.marketplace.placeholders.search} className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.common.listingTypes.all}</SelectItem>
                  <SelectItem value="sell">{copy.common.listingTypes.sell}</SelectItem>
                  <SelectItem value="buy">{copy.common.listingTypes.buy}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
          ) : displayedListings.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedListings.map((listing) => (
                <div key={listing.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${listing.listing_type === "sell" ? "bg-success/10" : "bg-accent/10"}`}>
                        {listing.listing_type === "sell" ? <TrendingUp className="w-5 h-5 text-success" /> : <ShoppingCart className="w-5 h-5 text-accent" />}
                      </div>
                      <Badge variant={listing.listing_type === "sell" ? "default" : "secondary"} className="text-xs">
                        {listing.listing_type === "sell" ? copy.common.listingTypes.selling : copy.common.listingTypes.buying}
                      </Badge>
                    </div>
                    {listing.status === "sold" && <Badge variant="outline" className="text-muted-foreground">{copy.common.listingTypes.sold}</Badge>}
                  </div>
                  <h4 className="font-semibold text-foreground mb-2 line-clamp-1">{listing.title}</h4>
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm"><Wheat className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground">{copy.marketplace.labels.crop}</span><span className="font-medium text-foreground capitalize">{listing.crop_type}</span></div>
                    <div className="flex items-center gap-2 text-sm"><Package className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground">{copy.marketplace.labels.qty}</span><span className="font-medium text-foreground">{listing.quantity} {listing.unit}</span></div>
                    <div className="flex items-center gap-2 text-sm"><Tag className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground">{copy.marketplace.labels.price}</span><span className="font-bold text-success">{listing.price_per_unit}/{listing.unit}</span></div>
                    {listing.location && <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground truncate">{listing.location}</span></div>}
                  </div>
                  {listing.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{listing.description}</p>}
                  {listing.contact_phone && <div className="flex items-center gap-2 text-sm mb-3 text-primary"><Phone className="w-4 h-4" /><a href={`tel:${listing.contact_phone}`}>{listing.contact_phone}</a></div>}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">{new Date(listing.created_at).toLocaleDateString()}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setChatOpen(listing.id)}><MessageCircle className="w-3 h-3 mr-1" /> {copy.marketplace.buttons.chat}</Button>
                      {listing.user_id === myId && listing.status === "active" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleMarkSold(listing.id)}>{copy.marketplace.buttons.sold}</Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(listing.id)}>{copy.marketplace.buttons.delete}</Button>
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
              <p className="text-muted-foreground mb-4">{tab === "my" ? copy.marketplace.emptyMine : copy.marketplace.emptyBrowse}</p>
              <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />{copy.marketplace.buttons.createFirst}</Button>
            </div>
          )}

          {chatOpen && (
            <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
              <div className="absolute inset-0 bg-black/50" onClick={() => setChatOpen(null)} />
              <div className="relative w-full max-w-lg bg-card rounded-t-2xl lg:rounded-2xl border border-border shadow-xl flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2"><MessageCircle className="w-4 h-4 text-primary" /> {copy.marketplace.chatTitle}</h3>
                    {chatListing && <p className="text-xs text-muted-foreground truncate">{chatListing.title}</p>}
                  </div>
                  <button onClick={() => setChatOpen(null)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
                </div>
                {!nameSet && (
                  <div className="p-4 border-b border-border bg-muted/50">
                    <Label className="text-xs">{copy.marketplace.labels.enterName}</Label>
                    <div className="flex gap-2 mt-1">
                      <Input placeholder={copy.marketplace.placeholders.chatName} value={chatName} onChange={(e) => setChatName(e.target.value)} className="flex-1" onKeyDown={(e) => e.key === "Enter" && handleSetName()} />
                      <Button size="sm" onClick={handleSetName} disabled={!chatName.trim()}>{copy.marketplace.buttons.setName}</Button>
                    </div>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
                  {chatMessages.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">{copy.marketplace.noMessages}</p>}
                  {chatMessages.map((msg) => {
                    const isMe = msg.sender_id === myId;
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
                <div className="p-3 border-t border-border flex gap-2">
                  <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={nameSet ? copy.marketplace.placeholders.chatMessage : copy.marketplace.placeholders.setNameFirst} className="flex-1" onKeyDown={(e) => e.key === "Enter" && handleSendChat()} disabled={!nameSet} />
                  <Button onClick={handleSendChat} disabled={!chatInput.trim() || !nameSet}><Send className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
