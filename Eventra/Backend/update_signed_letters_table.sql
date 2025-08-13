USE eventra_esrs;
ALTER TABLE signed_letters 
ADD COLUMN event_plan_id INT NULL 
AFTER booking_id;

ALTER TABLE signed_letters 
ADD CONSTRAINT fk_signed_letters_event_plan 
FOREIGN KEY (event_plan_id) REFERENCES event_plans(id) 
ON DELETE SET NULL;

UPDATE signed_letters 
SET event_plan_id = NULL 
WHERE event_plan_id IS NULL; 