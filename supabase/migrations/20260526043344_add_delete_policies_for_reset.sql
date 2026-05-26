/*
  # Add DELETE RLS policies for orders, order_items, and waiter_calls

  ## Purpose
  The manager reset feature needs to delete all rows from these tables.
  Previously only SELECT, INSERT, UPDATE policies existed — DELETE was blocked by RLS.

  ## Changes
  - Add DELETE policy on order_items
  - Add DELETE policy on orders
  - Add DELETE policy on waiter_calls
*/

CREATE POLICY "Anyone can delete order_items"
  ON order_items FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can delete orders"
  ON orders FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can delete waiter_calls"
  ON waiter_calls FOR DELETE
  TO anon, authenticated
  USING (true);
