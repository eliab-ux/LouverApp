-- ==========================================
-- CREATE REUSABLE TIMESTAMP UPDATE FUNCTION
-- ==========================================
-- This function is used by multiple triggers to automatically
-- update the updated_at column when a row is modified

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
