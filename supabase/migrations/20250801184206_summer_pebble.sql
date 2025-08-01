/*
  # Create lists table for shared shopping lists

  1. New Tables
    - `lists`
      - `id` (uuid, primary key) - the list identifier from URL
      - `items` (jsonb) - array of shopping list items
      - `updated_at` (timestamptz) - last updated timestamp

  2. Security
    - Enable RLS on `lists` table
    - Add policy for public read/write access (no authentication required)
*/

CREATE TABLE IF NOT EXISTS lists (
  id uuid PRIMARY KEY,
  items jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

-- Allow public access to all lists (no authentication required)
CREATE POLICY "Public access to lists"
  ON lists
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();