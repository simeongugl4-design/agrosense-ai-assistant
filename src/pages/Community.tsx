import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Heart, MessageCircle, Plus, Lightbulb, HelpCircle, Newspaper, Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getGuestId, getGuestName, setGuestName } from "@/lib/guest-id";
import { useDashboardTranslations } from "@/hooks/useDashboardTranslations";

interface Post {
  id: string;
  author_id: string;
  author_name: string;
  title: string;
  body: string;
  category: string;
  image_url: string | null;
  like_count: number;
  created_at: string;
}

const CATEGORY_META: Record<string, { icon: typeof Lightbulb; color: string; label: string }> = {
  tip: { icon: Lightbulb, color: "bg-success/10 text-success", label: "Tip" },
  question: { icon: HelpCircle, color: "bg-accent/10 text-accent", label: "Question" },
  news: { icon: Newspaper, color: "bg-warning/10 text-warning", label: "News" },
  photo: { icon: Camera, color: "bg-secondary/10 text-secondary", label: "Photo" },
};

export default function Community() {
  const { copy, language } = useDashboardTranslations();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    body: "",
    category: "tip",
    author_name: getGuestName(),
  });

  const fetchPosts = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setPosts(data as Post[]);
    setIsLoading(false);
  };

  useEffect(() => {
    void fetchPosts();
  }, []);

  const handleCreate = async () => {
    if (!draft.title.trim() || !draft.body.trim()) {
      toast({ variant: "destructive", title: "Please add a title and message" });
      return;
    }
    setSubmitting(true);
    setGuestName(draft.author_name);
    const { error } = await supabase.from("community_posts").insert({
      author_id: getGuestId(),
      author_name: draft.author_name.trim() || "Anonymous Farmer",
      title: draft.title.trim(),
      body: draft.body.trim(),
      category: draft.category,
      language,
    });
    setSubmitting(false);
    if (error) {
      toast({ variant: "destructive", title: "Failed to publish" });
      return;
    }
    toast({ title: "Posted to the community 🌱" });
    setDraft({ title: "", body: "", category: "tip", author_name: getGuestName() });
    setIsOpen(false);
    void fetchPosts();
  };

  const handleLike = async (post: Post) => {
    const { error } = await supabase
      .from("community_posts")
      .update({ like_count: post.like_count + 1 })
      .eq("id", post.id);
    if (!error) {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, like_count: p.like_count + 1 } : p)));
    }
  };

  const filtered = filter === "all" ? posts : posts.filter((p) => p.category === filter);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header
          title="Farmer Community"
          subtitle="Share tips, ask questions, and learn from farmers nearby"
        />
        <main className="p-4 lg:p-6 max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {[
              { key: "all", label: "All" },
              { key: "tip", label: "💡 Tips" },
              { key: "question", label: "❓ Questions" },
              { key: "news", label: "📰 News" },
              { key: "photo", label: "📷 Photos" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  filter === f.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/30"
                }`}
              >
                {f.label}
              </button>
            ))}
            <div className="flex-1" />
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" /> New post</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Share with the community</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Your name</Label>
                    <Input value={draft.author_name} onChange={(e) => setDraft({ ...draft, author_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tip">💡 Tip</SelectItem>
                        <SelectItem value="question">❓ Question</SelectItem>
                        <SelectItem value="news">📰 News</SelectItem>
                        <SelectItem value="photo">📷 Photo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Best time to plant kaukau?" />
                  </div>
                  <div>
                    <Label>Message</Label>
                    <Textarea
                      rows={5}
                      value={draft.body}
                      onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                      placeholder="Share your knowledge…"
                    />
                  </div>
                  <Button onClick={handleCreate} disabled={submitting} className="w-full">
                    {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Publishing…</> : "Publish"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground">No posts yet — be the first to share!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((post) => {
                const meta = CATEGORY_META[post.category] ?? CATEGORY_META.tip;
                const Icon = meta.icon;
                return (
                  <article key={post.id} className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${meta.color}`}>
                            <Icon className="w-3 h-3" /> {meta.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {post.author_name} · {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-semibold text-foreground">{post.title}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{post.body}</p>
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border text-sm">
                      <button
                        onClick={() => handleLike(post)}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Heart className="w-4 h-4" /> {post.like_count}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
