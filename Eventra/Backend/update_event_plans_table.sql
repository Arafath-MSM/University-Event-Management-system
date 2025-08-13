USE eventra_esrs;

ALTER TABLE event_plans 
ADD COLUMN approval_documents JSON NULL 
AFTER documents;

UPDATE event_plans 
SET approval_documents = NULL 
WHERE approval_documents IS NULL; 