-- Community posts: shared farmer feed
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'Anonymous',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'tip',
  image_url TEXT,
  language TEXT DEFAULT 'English',
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view community posts"
ON public.community_posts FOR SELECT USING (true);

CREATE POLICY "Anyone can create community posts"
ON public.community_posts FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update community posts"
ON public.community_posts FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete community posts"
ON public.community_posts FOR DELETE USING (true);

CREATE TRIGGER update_community_posts_updated_at
BEFORE UPDATE ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Post comments
CREATE TABLE public.community_post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'Anonymous',
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
ON public.community_post_comments FOR SELECT USING (true);

CREATE POLICY "Anyone can create comments"
ON public.community_post_comments FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete comments"
ON public.community_post_comments FOR DELETE USING (true);

-- Cooperative groups
CREATE TABLE public.cooperative_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  primary_crop TEXT,
  cover_image_url TEXT,
  member_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cooperative_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view groups"
ON public.cooperative_groups FOR SELECT USING (true);

CREATE POLICY "Anyone can create groups"
ON public.cooperative_groups FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update groups"
ON public.cooperative_groups FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete groups"
ON public.cooperative_groups FOR DELETE USING (true);

CREATE TRIGGER update_cooperative_groups_updated_at
BEFORE UPDATE ON public.cooperative_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Cooperative members
CREATE TABLE public.cooperative_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.cooperative_groups(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL,
  member_name TEXT NOT NULL DEFAULT 'Anonymous',
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (group_id, member_id)
);

ALTER TABLE public.cooperative_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view members"
ON public.cooperative_members FOR SELECT USING (true);

CREATE POLICY "Anyone can join groups"
ON public.cooperative_members FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can leave groups"
ON public.cooperative_members FOR DELETE USING (true);

-- Indexes for fast feeds
CREATE INDEX idx_community_posts_created ON public.community_posts(created_at DESC);
CREATE INDEX idx_community_post_comments_post ON public.community_post_comments(post_id, created_at);
CREATE INDEX idx_cooperative_members_group ON public.cooperative_members(group_id);
CREATE INDEX idx_cooperative_members_member ON public.cooperative_members(member_id);