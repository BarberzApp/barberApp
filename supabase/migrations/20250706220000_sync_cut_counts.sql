-- Migration: Sync cuts table counts with analytics and comments

-- Update likes count
UPDATE cuts
SET likes = sub.likes_count
FROM (
  SELECT cut_id, COUNT(*) AS likes_count
  FROM cut_analytics
  WHERE action_type = 'like'
  GROUP BY cut_id
) AS sub
WHERE cuts.id = sub.cut_id;

-- Update shares count
UPDATE cuts
SET shares = sub.shares_count
FROM (
  SELECT cut_id, COUNT(*) AS shares_count
  FROM cut_analytics
  WHERE action_type = 'share'
  GROUP BY cut_id
) AS sub
WHERE cuts.id = sub.cut_id;

-- Update comments count
UPDATE cuts
SET comments_count = sub.comments_count
FROM (
  SELECT cut_id, COUNT(*) AS comments_count
  FROM cut_comments
  GROUP BY cut_id
) AS sub
WHERE cuts.id = sub.cut_id;

-- Set to zero for cuts with no analytics/comments
UPDATE cuts SET likes = 0 WHERE likes IS NULL;
UPDATE cuts SET shares = 0 WHERE shares IS NULL;
UPDATE cuts SET comments_count = 0 WHERE comments_count IS NULL; 

-- Add barber_sms_notifications and client_sms_notifications columns to booking_texts
ALTER TABLE booking_texts
ADD COLUMN IF NOT EXISTS barber_sms_notifications BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS client_sms_notifications BOOLEAN DEFAULT FALSE; 

-- Function to update comments_count in cuts
CREATE OR REPLACE FUNCTION update_cut_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE cuts
  SET comments_count = (
    SELECT COUNT(*) FROM cut_comments WHERE cut_id = NEW.cut_id
  )
  WHERE id = NEW.cut_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for INSERT on cut_comments
DROP TRIGGER IF EXISTS trg_update_cut_comments_count_insert ON cut_comments;
CREATE TRIGGER trg_update_cut_comments_count_insert
AFTER INSERT ON cut_comments
FOR EACH ROW EXECUTE FUNCTION update_cut_comments_count();

-- Trigger for DELETE on cut_comments
DROP TRIGGER IF EXISTS trg_update_cut_comments_count_delete ON cut_comments;
CREATE TRIGGER trg_update_cut_comments_count_delete
AFTER DELETE ON cut_comments
FOR EACH ROW EXECUTE FUNCTION update_cut_comments_count();

-- Trigger for UPDATE of cut_id on cut_comments
DROP TRIGGER IF EXISTS trg_update_cut_comments_count_update ON cut_comments;
CREATE TRIGGER trg_update_cut_comments_count_update
AFTER UPDATE OF cut_id ON cut_comments
FOR EACH ROW EXECUTE FUNCTION update_cut_comments_count(); 