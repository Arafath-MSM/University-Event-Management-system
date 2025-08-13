-- Email Logs Table
-- This table tracks all emails sent by the system

CREATE TABLE IF NOT EXISTS `email_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_plan_id` int(11) DEFAULT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `recipient_email` varchar(255) NOT NULL,
  `email_type` enum('signed_letters', 'approval_notification', 'rejection_notification', 'reminder', 'general') NOT NULL,
  `subject` varchar(500) DEFAULT NULL,
  `letters_sent` text DEFAULT NULL, -- JSON array of letters sent
  `sent_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('sent', 'failed', 'pending') NOT NULL DEFAULT 'sent',
  `error_message` text DEFAULT NULL,
  `delivery_confirmation` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  KEY `idx_event_plan_id` (`event_plan_id`),
  KEY `idx_booking_id` (`booking_id`),
  KEY `idx_recipient_email` (`recipient_email`),
  KEY `idx_email_type` (`email_type`),
  KEY `idx_sent_at` (`sent_at`),
  KEY `idx_status` (`status`),
  
  CONSTRAINT `fk_email_logs_event_plan` FOREIGN KEY (`event_plan_id`) REFERENCES `event_plans` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_email_logs_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO `email_logs` (`event_plan_id`, `recipient_email`, `email_type`, `subject`, `letters_sent`, `status`) VALUES
(1, 'test@university.edu', 'signed_letters', 'Event Plan Approved - Signed Letters: Test Event', '["VC Approval", "Warden Approval", "Service Provider Approval", "Administration Approval"]', 'sent'),
(2, 'faculty@university.edu', 'signed_letters', 'Event Plan Approved - Signed Letters: Faculty Event', '["VC Approval", "Warden Approval", "Service Provider Approval", "Administration Approval"]', 'sent');

-- Create index for better performance
CREATE INDEX `idx_email_logs_composite` ON `email_logs` (`event_plan_id`, `email_type`, `status`);
CREATE INDEX `idx_email_logs_date_status` ON `email_logs` (`sent_at`, `status`);
