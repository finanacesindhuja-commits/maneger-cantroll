-- Create a trigger function to sync statuses
CREATE OR REPLACE FUNCTION sync_loan_credited_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If disbursement_status is being updated to 'CREDITED' 
  -- and status is not already 'CREDITED'
  IF NEW.disbursement_status = 'CREDITED' AND OLD.disbursement_status IS DISTINCT FROM 'CREDITED' THEN
    NEW.status = 'CREDITED';
    
    -- Also update the credited_at timestamp if needed
    IF NEW.credited_at IS NULL THEN
        NEW.credited_at = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it already exists to avoid conflicts
DROP TRIGGER IF EXISTS trg_sync_loan_credited_status ON loans;

-- Create the trigger
CREATE TRIGGER trg_sync_loan_credited_status
BEFORE UPDATE ON loans
FOR EACH ROW
EXECUTE FUNCTION sync_loan_credited_status();
