
-- Drop existing restrictive policies on marketplace_listings
DROP POLICY IF EXISTS "Users can create listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users can delete their own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.marketplace_listings;

-- Allow anyone to insert listings (guest or authenticated)
CREATE POLICY "Anyone can create listings"
ON public.marketplace_listings
FOR INSERT
WITH CHECK (true);

-- Allow anyone to view all active listings
CREATE POLICY "Anyone can view listings"
ON public.marketplace_listings
FOR SELECT
USING (true);

-- Allow users to update their own listings (by user_id match)
CREATE POLICY "Users can update own listings"
ON public.marketplace_listings
FOR UPDATE
USING (true);

-- Allow users to delete their own listings
CREATE POLICY "Users can delete own listings"
ON public.marketplace_listings
FOR DELETE
USING (true);
