/*
  # FreshBite - Waiters Table & Role Auth

  ## Summary
  Adds role-based access control without Supabase Auth.
  Stores waiter profiles with passwords (plaintext as requested by manager visibility requirement).
  Tracks which waiter attended/served each order and waiter call.

  ## New Tables
  1. `role_credentials` - stores chef/manager passwords (fixed roles)
  2. `waiters` - stores waiter names and passwords, managed by manager

  ## Modified Tables
  - `waiter_calls` - adds `attended_by_waiter_id` (uuid fk -> waiters)
  - `orders` - adds `served_by_waiter_id` (uuid fk -> waiters)

  ## Security
  - RLS enabled, anon can read/write (app-level auth enforced in frontend)
*/

-- role_credentials (chef, manager)
CREATE TABLE IF NOT EXISTS role_credentials (
  role text PRIMARY KEY,
  password text NOT NULL
);

ALTER TABLE role_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read role_credentials"
  ON role_credentials FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update role_credentials"
  ON role_credentials FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Seed chef and manager passwords
INSERT INTO role_credentials (role, password) VALUES
  ('chef', 'ChefAtFreshBite'),
  ('manager', 'ManagerAtFreshBite')
ON CONFLICT (role) DO NOTHING;

-- waiters
CREATE TABLE IF NOT EXISTS waiters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  password text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE waiters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read waiters"
  ON waiters FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert waiters"
  ON waiters FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update waiters"
  ON waiters FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete waiters"
  ON waiters FOR DELETE
  TO anon, authenticated
  USING (true);

-- Seed sample waiters
INSERT INTO waiters (name, password) VALUES
  ('Arjun Kumar', 'Waiter@Arjun1'),
  ('Priya Sharma', 'Waiter@Priya2'),
  ('Mohammed Irfan', 'Waiter@Irfan3')
ON CONFLICT DO NOTHING;

-- Add attended_by_waiter_id to waiter_calls
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waiter_calls' AND column_name = 'attended_by_waiter_id'
  ) THEN
    ALTER TABLE waiter_calls ADD COLUMN attended_by_waiter_id uuid REFERENCES waiters(id);
  END IF;
END $$;

-- Add served_by_waiter_id to orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'served_by_waiter_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN served_by_waiter_id uuid REFERENCES waiters(id);
  END IF;
END $$;
