-- Add calendar sync tables for Google Calendar integration
-- This migration adds tables to track calendar connections and synced events

-- Create user_calendar_connections table
CREATE TABLE IF NOT EXISTS user_calendar_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google_calendar', 'outlook', 'apple_calendar')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  calendar_id TEXT DEFAULT 'primary',
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_direction TEXT DEFAULT 'bidirectional' CHECK (sync_direction IN ('inbound', 'outbound', 'bidirectional')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one connection per user per provider
  UNIQUE(user_id, provider)
);

-- Create synced_events table to track synced events
CREATE TABLE IF NOT EXISTS synced_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  external_event_id TEXT NOT NULL,
  external_calendar_id TEXT NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  event_data JSONB,
  sync_direction TEXT CHECK (sync_direction IN ('inbound', 'outbound', 'bidirectional')),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed', 'conflict')),
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique external event per user
  UNIQUE(user_id, external_event_id, external_calendar_id)
);

-- Create calendar_sync_logs table for debugging
CREATE TABLE IF NOT EXISTS calendar_sync_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES user_calendar_connections(id) ON DELETE CASCADE,
  operation TEXT NOT NULL CHECK (operation IN ('sync_to_external', 'sync_from_external', 'create_event', 'update_event', 'delete_event')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  details JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_calendar_connections_user_id ON user_calendar_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_calendar_connections_provider ON user_calendar_connections(provider);
CREATE INDEX IF NOT EXISTS idx_synced_events_user_id ON synced_events(user_id);
CREATE INDEX IF NOT EXISTS idx_synced_events_booking_id ON synced_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_synced_events_external_id ON synced_events(external_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_user_id ON calendar_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_created_at ON calendar_sync_logs(created_at);

-- Enable RLS on new tables
ALTER TABLE user_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_calendar_connections
CREATE POLICY "Users can view own calendar connections"
  ON user_calendar_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar connections"
  ON user_calendar_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar connections"
  ON user_calendar_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar connections"
  ON user_calendar_connections FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for synced_events
CREATE POLICY "Users can view own synced events"
  ON synced_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own synced events"
  ON synced_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own synced events"
  ON synced_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own synced events"
  ON synced_events FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for calendar_sync_logs
CREATE POLICY "Users can view own sync logs"
  ON calendar_sync_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync logs"
  ON calendar_sync_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE user_calendar_connections IS 'Stores OAuth connections to external calendar providers';
COMMENT ON TABLE synced_events IS 'Tracks events synced between app and external calendars';
COMMENT ON TABLE calendar_sync_logs IS 'Logs sync operations for debugging and monitoring';

COMMENT ON COLUMN user_calendar_connections.provider IS 'Calendar provider (google_calendar, outlook, apple_calendar)';
COMMENT ON COLUMN user_calendar_connections.sync_direction IS 'Direction of sync (inbound, outbound, bidirectional)';
COMMENT ON COLUMN synced_events.external_event_id IS 'Event ID from external calendar provider';
COMMENT ON COLUMN synced_events.event_data IS 'Full event data from external calendar';
COMMENT ON COLUMN synced_events.sync_status IS 'Status of sync operation (synced, pending, failed, conflict)'; 