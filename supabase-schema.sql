-- Create quick_rolls table
CREATE TABLE IF NOT EXISTS quick_rolls (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  count INTEGER NOT NULL,
  dice_type INTEGER NOT NULL,
  modifier INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE quick_rolls ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own quick rolls
CREATE POLICY "Users can view their own quick rolls"
  ON quick_rolls
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own quick rolls
CREATE POLICY "Users can insert their own quick rolls"
  ON quick_rolls
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own quick rolls
CREATE POLICY "Users can update their own quick rolls"
  ON quick_rolls
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: Users can delete their own quick rolls
CREATE POLICY "Users can delete their own quick rolls"
  ON quick_rolls
  FOR DELETE
  USING (auth.uid() = user_id);

