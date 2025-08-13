ALTER TABLE notifications 
MODIFY COLUMN type ENUM(
    'booking_request', 
    'booking_approved', 
    'booking_rejected', 
    'booking_action_confirmation',
    'letter_sent', 
    'letter_received', 
    'service_provider_notified', 
    'final_approval', 
    'event_plan_submitted',
    'event_plan_request',
    'event_plan_approved',
    'event_plan_rejected',
    'event_plan_action_confirmation',
    'system'
) NOT NULL; 