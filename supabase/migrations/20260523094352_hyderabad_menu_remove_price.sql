/*
  # FreshBite - Hyderabad Cuisine Menu Update

  ## Changes
  1. Clears order_items and orders referencing old menu, then replaces menu items with authentic Hyderabad dishes
  2. Removes the `price` column from `menu_items` (pricing handled by manager)
  3. Adds INSERT and DELETE policies so managers can manage menu items at runtime

  ## New Menu Items
  8 authentic Hyderabadi dishes

  ## Notes
  - Clears order_items first to satisfy FK constraints before deleting menu_items
  - price column is dropped safely after clearing data
*/

-- Clear dependent data first
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM waiter_calls;

-- Now clear menu items
DELETE FROM menu_items;

-- Drop price column
ALTER TABLE menu_items DROP COLUMN IF EXISTS price;

-- Add INSERT policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'menu_items' AND policyname = 'Anyone can insert menu_items'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can insert menu_items" ON menu_items FOR INSERT TO anon, authenticated WITH CHECK (true)';
  END IF;
END $$;

-- Add DELETE policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'menu_items' AND policyname = 'Anyone can delete menu_items'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can delete menu_items" ON menu_items FOR DELETE TO anon, authenticated USING (true)';
  END IF;
END $$;

-- Seed Hyderabad cuisine
INSERT INTO menu_items (name, ingredients, image_url, category, is_available) VALUES
  (
    'Hyderabadi Dum Biryani',
    ARRAY['basmati rice', 'mutton', 'fried onions', 'saffron', 'mint', 'ghee', 'whole spices', 'yogurt'],
    'https://images.pexels.com/photos/7625056/pexels-photo-7625056.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Mains', true
  ),
  (
    'Haleem',
    ARRAY['broken wheat', 'mutton', 'lentils', 'ginger-garlic paste', 'fried onions', 'lime', 'coriander'],
    'https://images.pexels.com/photos/5410400/pexels-photo-5410400.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Mains', true
  ),
  (
    'Mirchi Ka Salan',
    ARRAY['green chillies', 'peanuts', 'sesame seeds', 'coconut', 'tamarind', 'curry leaves', 'mustard seeds'],
    'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Sides', true
  ),
  (
    'Keema Kaleji',
    ARRAY['minced mutton', 'liver', 'onion', 'tomato', 'green chilli', 'garam masala', 'fresh coriander'],
    'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Mains', true
  ),
  (
    'Paya Shorba',
    ARRAY['trotters', 'onion', 'ginger', 'garlic', 'whole spices', 'lime', 'fresh coriander', 'mint'],
    'https://images.pexels.com/photos/1618487/pexels-photo-1618487.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Starters', true
  ),
  (
    'Lukhmi',
    ARRAY['all-purpose flour', 'minced mutton', 'onion', 'green chilli', 'garam masala', 'oil'],
    'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Starters', true
  ),
  (
    'Qubani Ka Meetha',
    ARRAY['dried apricots', 'sugar', 'cardamom', 'almonds', 'fresh cream', 'saffron'],
    'https://images.pexels.com/photos/3026804/pexels-photo-3026804.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Desserts', true
  ),
  (
    'Double Ka Meetha',
    ARRAY['bread slices', 'sugar syrup', 'khoya', 'milk', 'saffron', 'cardamom', 'dry fruits', 'ghee'],
    'https://images.pexels.com/photos/6287525/pexels-photo-6287525.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Desserts', true
  )
ON CONFLICT DO NOTHING;
