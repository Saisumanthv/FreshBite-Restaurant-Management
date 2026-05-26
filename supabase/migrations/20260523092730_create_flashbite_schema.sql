/*
  # FlashBite Restaurant Order Management Schema

  ## Summary
  Creates the complete database schema for the FlashBite restaurant app with real-time support.

  ## New Tables

  1. `menu_items`
     - id (uuid, pk)
     - name (text)
     - ingredients (text[])
     - image_url (text)
     - price (numeric)
     - is_available (boolean, default true)
     - category (text)

  2. `tables`
     - id (int, pk, 1–10)
     - qr_code_payload (text)

  3. `waiter_calls`
     - id (uuid, pk)
     - table_id (int, fk -> tables)
     - is_resolved (boolean, default false)
     - created_at (timestamp)

  4. `orders`
     - id (uuid, pk)
     - table_id (int, fk -> tables)
     - status (enum: ordered, cooking, ready_to_serve, served, cancelled)
     - created_at (timestamp)

  5. `order_items`
     - id (uuid, pk)
     - order_id (uuid, fk -> orders)
     - menu_item_id (uuid, fk -> menu_items)
     - quantity (int)

  ## Security
  - RLS enabled on all tables
  - Anon users can read/write (restaurant kiosk model — no auth)

  ## Notes
  - Tables 1–10 are seeded automatically
  - 8 menu items with Pexels images are seeded
*/

-- Order status enum
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('ordered', 'cooking', 'ready_to_serve', 'served', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- menu_items
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  ingredients text[] NOT NULL DEFAULT '{}',
  image_url text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'Main',
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read menu_items"
  ON menu_items FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update menu_items"
  ON menu_items FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- tables
CREATE TABLE IF NOT EXISTS tables (
  id int PRIMARY KEY,
  qr_code_payload text NOT NULL DEFAULT ''
);

ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tables"
  ON tables FOR SELECT
  TO anon, authenticated
  USING (true);

-- waiter_calls
CREATE TABLE IF NOT EXISTS waiter_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id int NOT NULL REFERENCES tables(id),
  is_resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE waiter_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read waiter_calls"
  ON waiter_calls FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert waiter_calls"
  ON waiter_calls FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update waiter_calls"
  ON waiter_calls FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id int NOT NULL REFERENCES tables(id),
  status order_status NOT NULL DEFAULT 'ordered',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read orders"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert orders"
  ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update orders"
  ON orders FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- order_items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES menu_items(id),
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read order_items"
  ON order_items FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert order_items"
  ON order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update order_items"
  ON order_items FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Seed tables 1–10
INSERT INTO tables (id, qr_code_payload) VALUES
  (1, 'flashbite://table/1'),
  (2, 'flashbite://table/2'),
  (3, 'flashbite://table/3'),
  (4, 'flashbite://table/4'),
  (5, 'flashbite://table/5'),
  (6, 'flashbite://table/6'),
  (7, 'flashbite://table/7'),
  (8, 'flashbite://table/8'),
  (9, 'flashbite://table/9'),
  (10, 'flashbite://table/10')
ON CONFLICT (id) DO NOTHING;

-- Seed menu items
INSERT INTO menu_items (name, ingredients, image_url, price, category, is_available) VALUES
  (
    'Grilled Salmon',
    ARRAY['Atlantic salmon', 'lemon butter', 'garlic', 'dill', 'capers'],
    'https://images.pexels.com/photos/3655916/pexels-photo-3655916.jpeg?auto=compress&cs=tinysrgb&w=800',
    24.99, 'Mains', true
  ),
  (
    'Margherita Pizza',
    ARRAY['San Marzano tomatoes', 'fresh mozzarella', 'basil', 'olive oil', 'sea salt'],
    'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?auto=compress&cs=tinysrgb&w=800',
    16.99, 'Mains', true
  ),
  (
    'Caesar Salad',
    ARRAY['romaine lettuce', 'parmesan', 'croutons', 'caesar dressing', 'anchovies'],
    'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?auto=compress&cs=tinysrgb&w=800',
    12.50, 'Starters', true
  ),
  (
    'Beef Tenderloin',
    ARRAY['beef tenderloin', 'red wine reduction', 'roasted garlic', 'thyme', 'rosemary'],
    'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=800',
    38.00, 'Mains', true
  ),
  (
    'Mushroom Risotto',
    ARRAY['arborio rice', 'porcini mushrooms', 'parmesan', 'white wine', 'shallots'],
    'https://images.pexels.com/photos/6287525/pexels-photo-6287525.jpeg?auto=compress&cs=tinysrgb&w=800',
    18.50, 'Mains', true
  ),
  (
    'Chocolate Lava Cake',
    ARRAY['dark chocolate', 'butter', 'eggs', 'flour', 'vanilla ice cream'],
    'https://images.pexels.com/photos/3026804/pexels-photo-3026804.jpeg?auto=compress&cs=tinysrgb&w=800',
    9.99, 'Desserts', true
  ),
  (
    'Tom Yum Soup',
    ARRAY['lemongrass', 'galangal', 'kaffir lime', 'prawns', 'mushrooms', 'chili'],
    'https://images.pexels.com/photos/1618487/pexels-photo-1618487.jpeg?auto=compress&cs=tinysrgb&w=800',
    11.00, 'Starters', true
  ),
  (
    'Truffle Fries',
    ARRAY['russet potatoes', 'truffle oil', 'parmesan', 'chives', 'sea salt'],
    'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=800',
    8.50, 'Sides', true
  )
ON CONFLICT DO NOTHING;
