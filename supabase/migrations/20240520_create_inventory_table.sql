-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  last_restocked TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Businesses can view their own inventory"
  ON inventory FOR SELECT
  USING (business_id = auth.uid());

CREATE POLICY "Businesses can insert their own inventory"
  ON inventory FOR INSERT
  WITH CHECK (business_id = auth.uid());

CREATE POLICY "Businesses can update their own inventory"
  ON inventory FOR UPDATE
  USING (business_id = auth.uid());

CREATE POLICY "Businesses can delete their own inventory"
  ON inventory FOR DELETE
  USING (business_id = auth.uid());

-- Create function to handle inventory updates
CREATE OR REPLACE FUNCTION handle_inventory_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory updates
CREATE TRIGGER on_inventory_updated
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION handle_inventory_update(); 