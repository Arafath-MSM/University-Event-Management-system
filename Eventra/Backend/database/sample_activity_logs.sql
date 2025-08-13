-- Sample Activity Logs for Testing
-- This script inserts sample data into the activity_logs table

USE eventra_esrs;

-- Insert sample activity logs
INSERT INTO activity_logs (user_id, action, details, type, target_id, target_type, ip_address, user_agent, created_at) VALUES
-- User activities
(1, 'user_login', 'User logged in: superadmin@university.edu', 'user', 1, 'user', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL 1 HOUR),
(2, 'user_login', 'User logged in: amal@university.edu', 'user', 2, 'user', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', NOW() - INTERVAL 2 HOUR),
(3, 'user_logout', 'User logged out: fas@university.edu', 'user', 3, 'user', '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL 3 HOUR),

-- Booking activities
(2, 'booking_created', 'New booking created: Computer Science Workshop', 'booking', 1, 'booking', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', NOW() - INTERVAL 4 HOUR),
(1, 'booking_approved', 'Booking approved: Computer Science Workshop', 'booking', 1, 'booking', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL 5 HOUR),
(2, 'booking_created', 'New booking created: Faculty Meeting', 'booking', 2, 'booking', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', NOW() - INTERVAL 6 HOUR),

-- Event plan activities
(2, 'event_plan_submitted', 'Event plan submitted: Annual Tech Conference', 'event_plan', 1, 'event_plan', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', NOW() - INTERVAL 7 HOUR),
(4, 'event_plan_approved', 'Event plan approved: Annual Tech Conference', 'event_plan', 1, 'event_plan', '192.168.1.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL 8 HOUR),
(5, 'event_plan_approved', 'Event plan approved: Annual Tech Conference', 'event_plan', 1, 'event_plan', '192.168.1.104', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', NOW() - INTERVAL 9 HOUR),

-- User management activities
(1, 'user_created', 'New user created: john@university.edu', 'user', 6, 'user', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL 10 HOUR),
(1, 'user_updated', 'User updated: amal@university.edu', 'user', 2, 'user', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL 11 HOUR),
(1, 'user_deleted', 'User deleted: olduser@university.edu', 'user', NULL, 'user', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL 12 HOUR),

-- System activities
(NULL, 'system_maintenance', 'Database backup completed successfully', 'system', NULL, NULL, '192.168.1.1', 'System Process', NOW() - INTERVAL 13 HOUR),
(NULL, 'system_alert', 'High memory usage detected on server', 'system', NULL, NULL, '192.168.1.1', 'System Monitor', NOW() - INTERVAL 14 HOUR),
(NULL, 'system_backup', 'Automated backup started at 2:00 AM', 'system', NULL, NULL, '192.168.1.1', 'Cron Job', NOW() - INTERVAL 15 HOUR),

-- Venue activities
(1, 'venue_updated', 'Venue capacity updated: E Block Main Auditorium', 'venue', 1, 'venue', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL 16 HOUR),
(1, 'venue_maintenance', 'Venue marked for maintenance: Technology Lecture Theater 1', 'venue', 2, 'venue', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL 17 HOUR),

-- More recent activities for real-time testing
(2, 'booking_created', 'New booking created: Student Orientation', 'booking', 3, 'booking', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', NOW() - INTERVAL 5 MINUTE),
(1, 'user_login', 'User logged in: superadmin@university.edu', 'user', 1, 'user', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL 2 MINUTE),
(4, 'event_plan_submitted', 'Event plan submitted: Student Union Election', 'event_plan', 2, 'event_plan', '192.168.1.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL 1 MINUTE);

-- Display the inserted logs
SELECT 
    al.id,
    al.action,
    al.details,
    al.type,
    al.target_type,
    al.ip_address,
    al.created_at,
    u.name as user_name,
    u.role as user_role
FROM activity_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 20;
