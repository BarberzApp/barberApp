-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id text NOT NULL,
  sender_id uuid NOT NULL,
  text text NOT NULL,
  status text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'messages' 
    AND indexname = 'messages_conversation_id_idx'
  ) THEN
    CREATE INDEX messages_conversation_id_idx ON messages(conversation_id);
  END IF;
END $$;

-- Enable real-time for the messages table
ALTER TABLE messages REPLICA IDENTITY FULL; 