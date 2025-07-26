-- Create reel comments table
CREATE TABLE IF NOT EXISTS reel_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reel_id UUID REFERENCES reels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reel_comments_reel_id ON reel_comments(reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_comments_user_id ON reel_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_reel_comments_created_at ON reel_comments(created_at DESC);

-- Enable RLS
ALTER TABLE reel_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments
CREATE POLICY "Comments are viewable by everyone"
    ON reel_comments FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own comments"
    ON reel_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
    ON reel_comments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
    ON reel_comments FOR DELETE
    USING (auth.uid() = user_id);

-- Add comments count to reels table (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reels' AND column_name = 'comments_count'
    ) THEN
        ALTER TABLE reels ADD COLUMN comments_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Function to update reel comments count
CREATE OR REPLACE FUNCTION update_reel_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE reels 
        SET comments_count = comments_count + 1
        WHERE id = NEW.reel_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE reels 
        SET comments_count = comments_count - 1
        WHERE id = OLD.reel_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_reel_comments_count ON reel_comments;

-- Create trigger to automatically update comments count
CREATE TRIGGER trigger_update_reel_comments_count
    AFTER INSERT OR DELETE ON reel_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_reel_comments_count();

-- Initialize comments count for existing reels
UPDATE reels 
SET comments_count = (
    SELECT COUNT(*) 
    FROM reel_comments 
    WHERE reel_comments.reel_id = reels.id
);

-- Add comments for documentation
COMMENT ON TABLE reel_comments IS 'Stores comments on reel videos';
COMMENT ON COLUMN reel_comments.comment IS 'The comment text content'; 