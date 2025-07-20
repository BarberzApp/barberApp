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