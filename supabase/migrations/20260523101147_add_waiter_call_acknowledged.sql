/*
  # Add is_acknowledged to waiter_calls

  ## Changes
  - Adds `is_acknowledged` boolean column (default false) to `waiter_calls`
  - When waiter clicks "Attend", is_acknowledged = true → customer sees "Waiter is on the way"
  - When waiter physically arrives and resolves, is_resolved = true
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waiter_calls' AND column_name = 'is_acknowledged'
  ) THEN
    ALTER TABLE waiter_calls ADD COLUMN is_acknowledged boolean NOT NULL DEFAULT false;
  END IF;
END $$;
