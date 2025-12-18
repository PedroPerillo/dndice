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

-- Create user_preferences table for theme and other user settings
CREATE TABLE IF NOT EXISTS user_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT DEFAULT 'forest',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE quick_rolls ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own quick rolls
DROP POLICY IF EXISTS "Users can view their own quick rolls" ON quick_rolls;
CREATE POLICY "Users can view their own quick rolls"
  ON quick_rolls
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own quick rolls
DROP POLICY IF EXISTS "Users can insert their own quick rolls" ON quick_rolls;
CREATE POLICY "Users can insert their own quick rolls"
  ON quick_rolls
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own quick rolls
DROP POLICY IF EXISTS "Users can update their own quick rolls" ON quick_rolls;
CREATE POLICY "Users can update their own quick rolls"
  ON quick_rolls
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: Users can delete their own quick rolls
DROP POLICY IF EXISTS "Users can delete their own quick rolls" ON quick_rolls;
CREATE POLICY "Users can delete their own quick rolls"
  ON quick_rolls
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable Row Level Security for user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view their own preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
CREATE POLICY "Users can view their own preferences"
  ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own preferences
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
CREATE POLICY "Users can insert their own preferences"
  ON user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own preferences
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
CREATE POLICY "Users can update their own preferences"
  ON user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: Users can delete their own preferences
DROP POLICY IF EXISTS "Users can delete their own preferences" ON user_preferences;
CREATE POLICY "Users can delete their own preferences"
  ON user_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

