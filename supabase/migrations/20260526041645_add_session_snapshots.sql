/*
  # Add Session Snapshots Table

  ## Purpose
  Stores archived session data when the manager resets the dashboard.
  Each snapshot captures a complete point-in-time summary of all orders,
  waiter performance, and table activity before data is cleared.

  ## New Tables

  ### session_snapshots
  - `id` (uuid, PK) - Unique snapshot identifier
  - `session_index` (int) - Auto-incremented session number (1, 2, 3...)
  - `snapshot_date` (timestamptz) - When the reset was triggered
  - `total_orders` (int) - Total orders in that session
  - `orders_served` (int) - Orders successfully served
  - `orders_cancelled` (int) - Orders cancelled
  - `orders_cooking` (int) - Orders still in kitchen at reset time
  - `orders_pending` (int) - Orders placed but not started at reset time
  - `waiter_summary` (jsonb) - Per-waiter stats: name, orders served, calls attended
  - `table_summary` (jsonb) - Per-table stats: order count, items count
  - `orders_snapshot` (jsonb) - Full orders array snapshot for detailed view
  - `created_at` (timestamptz) - Row creation timestamp

  ## Security
  - RLS enabled
  - Anon and authenticated users can read and insert (manager uses anon key)
*/

CREATE TABLE IF NOT EXISTS session_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_index int NOT NULL,
  snapshot_date timestamptz NOT NULL DEFAULT now(),
  total_orders int NOT NULL DEFAULT 0,
  orders_served int NOT NULL DEFAULT 0,
  orders_cancelled int NOT NULL DEFAULT 0,
  orders_cooking int NOT NULL DEFAULT 0,
  orders_pending int NOT NULL DEFAULT 0,
  waiter_summary jsonb NOT NULL DEFAULT '[]',
  table_summary jsonb NOT NULL DEFAULT '[]',
  orders_snapshot jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE session_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read session snapshots"
  ON session_snapshots FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert session snapshots"
  ON session_snapshots FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
