-- Add time_off table for barbers to schedule vacation days and time off
CREATE TABLE IF NOT EXISTS time_off (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT time_off_date_range_check CHECK (end_date >= start_date)
);

-- Add RLS policies for time_off table
ALTER TABLE time_off ENABLE ROW LEVEL SECURITY;

-- Barbers can only see their own time off
CREATE POLICY "Barbers can view own time off" ON time_off
    FOR SELECT USING (auth.uid() IN (
        SELECT id FROM profiles WHERE id = barber_id
    ));

-- Barbers can insert their own time off
CREATE POLICY "Barbers can insert own time off" ON time_off
    FOR INSERT WITH CHECK (auth.uid() IN (
        SELECT id FROM profiles WHERE id = barber_id
    ));

-- Barbers can update their own time off
CREATE POLICY "Barbers can update own time off" ON time_off
    FOR UPDATE USING (auth.uid() IN (
        SELECT id FROM profiles WHERE id = barber_id
    ));

-- Barbers can delete their own time off
CREATE POLICY "Barbers can delete own time off" ON time_off
    FOR DELETE USING (auth.uid() IN (
        SELECT id FROM profiles WHERE id = barber_id
    ));

-- Create index for better performance
CREATE INDEX idx_time_off_barber_id ON time_off(barber_id);
CREATE INDEX idx_time_off_date_range ON time_off(start_date, end_date); 