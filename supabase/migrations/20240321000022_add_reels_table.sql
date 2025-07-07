-- Create reels table for video portfolio
CREATE TABLE IF NOT EXISTS reels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    thumbnail TEXT,
    category TEXT NOT NULL DEFAULT 'hair-styling',
    duration INTEGER DEFAULT 0, -- in seconds
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT reels_barber_title_key UNIQUE (barber_id, title)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reels_barber_id ON reels(barber_id);
CREATE INDEX IF NOT EXISTS idx_reels_category ON reels(category);
CREATE INDEX IF NOT EXISTS idx_reels_created_at ON reels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reels_views ON reels(views DESC);
CREATE INDEX IF NOT EXISTS idx_reels_featured ON reels(is_featured) WHERE is_featured = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Reels are viewable by everyone if public" ON reels;
DROP POLICY IF EXISTS "Barbers can insert their own reels" ON reels;
DROP POLICY IF EXISTS "Barbers can update their own reels" ON reels;
DROP POLICY IF EXISTS "Barbers can delete their own reels" ON reels;

-- RLS Policies
CREATE POLICY "Reels are viewable by everyone if public"
    ON reels FOR SELECT
    USING (is_public = true OR auth.uid() = (
        SELECT user_id FROM barbers WHERE barbers.id = reels.barber_id
    ));

CREATE POLICY "Barbers can insert their own reels"
    ON reels FOR INSERT
    WITH CHECK (auth.uid() = (
        SELECT user_id FROM barbers WHERE barbers.id = reels.barber_id
    ));

CREATE POLICY "Barbers can update their own reels"
    ON reels FOR UPDATE
    USING (auth.uid() = (
        SELECT user_id FROM barbers WHERE barbers.id = reels.barber_id
    ));

CREATE POLICY "Barbers can delete their own reels"
    ON reels FOR DELETE
    USING (auth.uid() = (
        SELECT user_id FROM barbers WHERE barbers.id = reels.barber_id
    ));

-- Enable RLS
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;

-- Create reels analytics table for tracking views, likes, shares
CREATE TABLE IF NOT EXISTS reel_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reel_id UUID REFERENCES reels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    action_type TEXT CHECK (action_type IN ('view', 'like', 'share', 'comment')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT reel_analytics_unique_action UNIQUE (reel_id, user_id, action_type)
);

-- Add indexes for analytics
CREATE INDEX IF NOT EXISTS idx_reel_analytics_reel_id ON reel_analytics(reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_analytics_action_type ON reel_analytics(action_type);
CREATE INDEX IF NOT EXISTS idx_reel_analytics_created_at ON reel_analytics(created_at);

-- Enable RLS for analytics
ALTER TABLE reel_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics
CREATE POLICY "Analytics are viewable by reel owner"
    ON reel_analytics FOR SELECT
    USING (auth.uid() = (
        SELECT user_id FROM barbers 
        WHERE barbers.id = (
            SELECT barber_id FROM reels WHERE reels.id = reel_analytics.reel_id
        )
    ));

CREATE POLICY "Anyone can insert analytics"
    ON reel_analytics FOR INSERT
    WITH CHECK (true);

-- Function to update reel stats from analytics
CREATE OR REPLACE FUNCTION update_reel_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update views count
    UPDATE reels 
    SET views = (
        SELECT COUNT(*) 
        FROM reel_analytics 
        WHERE reel_id = NEW.reel_id AND action_type = 'view'
    )
    WHERE id = NEW.reel_id;
    
    -- Update likes count
    UPDATE reels 
    SET likes = (
        SELECT COUNT(*) 
        FROM reel_analytics 
        WHERE reel_id = NEW.reel_id AND action_type = 'like'
    )
    WHERE id = NEW.reel_id;
    
    -- Update shares count
    UPDATE reels 
    SET shares = (
        SELECT COUNT(*) 
        FROM reel_analytics 
        WHERE reel_id = NEW.reel_id AND action_type = 'share'
    )
    WHERE id = NEW.reel_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update reel stats
CREATE TRIGGER trigger_update_reel_stats
    AFTER INSERT OR DELETE ON reel_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_reel_stats();

-- Add comments for documentation
COMMENT ON TABLE reels IS 'Stores video portfolio content for barbers';
COMMENT ON COLUMN reels.category IS 'Video category for organization and filtering';
COMMENT ON COLUMN reels.duration IS 'Video duration in seconds';
COMMENT ON COLUMN reels.views IS 'Total view count';
COMMENT ON COLUMN reels.likes IS 'Total like count';
COMMENT ON COLUMN reels.shares IS 'Total share count';
COMMENT ON COLUMN reels.is_featured IS 'Whether this reel is featured/promoted';
COMMENT ON COLUMN reels.is_public IS 'Whether this reel is publicly visible';

COMMENT ON TABLE reel_analytics IS 'Tracks user interactions with reels for analytics';
COMMENT ON COLUMN reel_analytics.action_type IS 'Type of user action (view, like, share, comment)'; 