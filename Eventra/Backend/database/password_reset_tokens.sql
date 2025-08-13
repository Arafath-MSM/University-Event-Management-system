-- Password Reset Tokens Table
-- This table stores password reset tokens for users

USE eventra_esrs;

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used TINYINT(1) DEFAULT 0,
    used_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at),
    INDEX idx_used (used),
    
    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comments
ALTER TABLE password_reset_tokens 
COMMENT = 'Stores password reset tokens for user password recovery';

-- Insert sample data (optional - for testing)
-- INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES 
-- (1, 'sample_token_123', DATE_ADD(NOW(), INTERVAL 1 HOUR));

-- Show table structure
DESCRIBE password_reset_tokens;
