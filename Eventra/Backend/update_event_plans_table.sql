-- Add approval_documents column to event_plans table
USE eventra_esrs;

-- Add approval_documents column if it doesn't exist
ALTER TABLE event_plans 
ADD COLUMN approval_documents JSON NULL 
AFTER documents;

-- Update existing records to have empty approval_documents
UPDATE event_plans 
SET approval_documents = NULL 
WHERE approval_documents IS NULL; 