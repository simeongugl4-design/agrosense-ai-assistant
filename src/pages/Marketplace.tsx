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
  ShoppingCart,
  Plus,
  MapPin,
  Phone,
  Tag,
  TrendingUp,
  Loader2,
  Search,
  Filter,
  Package,
  IndianRupee,
  Wheat,
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
  const [newListing, setNewListing] = useState({
    title: "",
    description: "",
    crop_type: "",
    quantity: "",
    unit: "kg",
    price_per_unit: "",
    location: "",
    listing_type: "sell",
    contact_phone: "",
  });

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("marketplace_listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch listings error:", error);
    } else {
      setListings(data || []);
    }
    setIsLoading(false);
  };

  const handleCreateListing = async () => {
    if (
      !newListing.title ||
      !newListing.crop_type ||
      !newListing.quantity ||
      !newListing.price_per_unit ||
      !user
    )
      return;

    const { error } = await supabase.from("marketplace_listings").insert({
      user_id: user.id,
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
      console.error("Create listing error:", error);
      toast({ variant: "destructive", title: "Failed to create listing" });
    } else {
      toast({ title: "Listing created! 🛒" });
      setIsDialogOpen(false);
      setNewListing({
        title: "",
        description: "",
        crop_type: "",
        quantity: "",
        unit: "kg",
        price_per_unit: "",
        location: "",
        listing_type: "sell",
        contact_phone: "",
      });
      fetchListings();
    }
  };

  const handleMarkSold = async (id: string) => {
    const { error } = await supabase
      .from("marketplace_listings")
      .update({ status: "sold" })
      .eq("id", id);

    if (!error) {
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: "sold" } : l))
      );
      toast({ title: "Marked as sold! ✅" });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("marketplace_listings")
      .delete()
      .eq("id", id);

    if (!error) {
      setListings((prev) => prev.filter((l) => l.id !== id));
      toast({ title: "Listing deleted" });
    }
  };

  const displayedListings = listings.filter((l) => {
    if (tab === "my") return l.user_id === user?.id;
    const matchesSearch =
      !searchQuery ||
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.crop_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      typeFilter === "all" || l.listing_type === typeFilter;
    return matchesSearch && matchesType && l.status === "active";
  });

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header
          title="Marketplace"
          subtitle="Buy and sell farm produce directly with other farmers"
        />

        <main className="p-4 lg:p-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {listings.filter((l) => l.status === "active").length}
              </p>
              <p className="text-sm text-muted-foreground">Active Listings</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-success">
                {listings.filter((l) => l.listing_type === "sell").length}
              </p>
              <p className="text-sm text-muted-foreground">For Sale</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-accent">
                {listings.filter((l) => l.listing_type === "buy").length}
              </p>
              <p className="text-sm text-muted-foreground">Buy Requests</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-secondary">
                {listings.filter((l) => l.user_id === user?.id).length}
              </p>
              <p className="text-sm text-muted-foreground">My Listings</p>
            </div>
          </div>

          {/* Tabs + Actions */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex bg-muted rounded-lg p-1">
              <button
                onClick={() => setTab("browse")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  tab === "browse"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Browse All
              </button>
              <button
                onClick={() => setTab("my")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  tab === "my"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                My Listings
              </button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> New Listing
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Listing</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Listing Type</Label>
                    <Select
                      value={newListing.listing_type}
                      onValueChange={(v) =>
                        setNewListing({ ...newListing, listing_type: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sell">I want to Sell</SelectItem>
                        <SelectItem value="buy">I want to Buy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      placeholder="e.g., Fresh organic wheat - 50 quintal"
                      value={newListing.title}
                      onChange={(e) =>
                        setNewListing({ ...newListing, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Crop Type *</Label>
                    <Select
                      value={newListing.crop_type}
                      onValueChange={(v) =>
                        setNewListing({ ...newListing, crop_type: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select crop" />
                      </SelectTrigger>
                      <SelectContent>
                        {cropOptions.map((c) => (
                          <SelectItem key={c} value={c.toLowerCase()}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2 col-span-1">
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        placeholder="50"
                        value={newListing.quantity}
                        onChange={(e) =>
                          setNewListing({ ...newListing, quantity: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2 col-span-1">
                      <Label>Unit</Label>
                      <Select
                        value={newListing.unit}
                        onValueChange={(v) =>
                          setNewListing({ ...newListing, unit: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">Kg</SelectItem>
                          <SelectItem value="quintal">Quintal</SelectItem>
                          <SelectItem value="ton">Ton</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-1">
                      <Label>Price/Unit *</Label>
                      <Input
                        type="number"
                        placeholder="₹2500"
                        value={newListing.price_per_unit}
                        onChange={(e) =>
                          setNewListing({
                            ...newListing,
                            price_per_unit: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        placeholder="e.g., Ludhiana, Punjab"
                        value={newListing.location}
                        onChange={(e) =>
                          setNewListing({ ...newListing, location: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Phone</Label>
                      <Input
                        placeholder="+91 XXXXX XXXXX"
                        value={newListing.contact_phone}
                        onChange={(e) =>
                          setNewListing({
                            ...newListing,
                            contact_phone: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Quality details, delivery info..."
                      value={newListing.description}
                      rows={3}
                      onChange={(e) =>
                        setNewListing({
                          ...newListing,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleCreateListing}
                    disabled={
                      !newListing.title ||
                      !newListing.crop_type ||
                      !newListing.quantity ||
                      !newListing.price_per_unit
                    }
                  >
                    Create Listing
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search & Filter (browse tab) */}
          {tab === "browse" && (
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search crops, locations..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
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
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : displayedListings.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedListings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          listing.listing_type === "sell"
                            ? "bg-success/10"
                            : "bg-accent/10"
                        }`}
                      >
                        {listing.listing_type === "sell" ? (
                          <TrendingUp className="w-5 h-5 text-success" />
                        ) : (
                          <ShoppingCart className="w-5 h-5 text-accent" />
                        )}
                      </div>
                      <Badge
                        variant={
                          listing.listing_type === "sell"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {listing.listing_type === "sell" ? "Selling" : "Buying"}
                      </Badge>
                    </div>
                    {listing.status === "sold" && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Sold
                      </Badge>
                    )}
                  </div>

                  <h4 className="font-semibold text-foreground mb-2 line-clamp-1">
                    {listing.title}
                  </h4>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Wheat className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Crop:</span>
                      <span className="font-medium text-foreground capitalize">
                        {listing.crop_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Qty:</span>
                      <span className="font-medium text-foreground">
                        {listing.quantity} {listing.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <IndianRupee className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-bold text-success">
                        ₹{listing.price_per_unit}/{listing.unit}
                      </span>
                    </div>
                    {listing.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">
                          {listing.location}
                        </span>
                      </div>
                    )}
                  </div>

                  {listing.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {listing.description}
                    </p>
                  )}

                  {listing.contact_phone && (
                    <div className="flex items-center gap-2 text-sm mb-4 text-primary">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${listing.contact_phone}`}>
                        {listing.contact_phone}
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </span>
                    {listing.user_id === user?.id && listing.status === "active" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkSold(listing.id)}
                        >
                          Mark Sold
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDelete(listing.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                    {listing.user_id !== user?.id && listing.contact_phone && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`tel:${listing.contact_phone}`}>
                          <Phone className="w-3 h-3 mr-1" /> Contact
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {tab === "my"
                  ? "You haven't created any listings yet."
                  : "No listings found. Be the first to list!"}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
