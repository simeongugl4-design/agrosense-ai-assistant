
-- Farm Calendar Events
CREATE TABLE public.farm_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'general', -- fertilizer, spraying, irrigation, harvest, sowing, general
  crop TEXT,
  plot_name TEXT,
  event_date DATE NOT NULL,
  reminder_date DATE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.farm_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own events" ON public.farm_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own events" ON public.farm_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own events" ON public.farm_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own events" ON public.farm_events FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_farm_events_updated_at
BEFORE UPDATE ON public.farm_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Marketplace Listings
CREATE TABLE public.marketplace_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  crop_type TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg', -- kg, quintal, ton
  price_per_unit NUMERIC NOT NULL,
  location TEXT,
  listing_type TEXT NOT NULL DEFAULT 'sell', -- sell, buy
  status TEXT NOT NULL DEFAULT 'active', -- active, sold, expired
  image_url TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Everyone can view active listings
CREATE POLICY "Anyone can view active listings" ON public.marketplace_listings FOR SELECT USING (status = 'active' OR auth.uid() = user_id);
CREATE POLICY "Users can create listings" ON public.marketplace_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own listings" ON public.marketplace_listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own listings" ON public.marketplace_listings FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_marketplace_listings_updated_at
BEFORE UPDATE ON public.marketplace_listings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
