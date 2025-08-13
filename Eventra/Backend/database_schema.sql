CREATE DATABASE IF NOT EXISTS eventra_esrs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eventra_esrs;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'faculty', 'service-provider', 'super-admin', 'vice-chancellor', 'administration', 'student-union', 'warden') NOT NULL,
    department VARCHAR(255),
    faculty VARCHAR(255),
    designation VARCHAR(255),
    bio TEXT,
    event_interests TEXT,
    service_type ENUM('Sound System', 'Media') NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    is_email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE password_reset_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(100) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_expires_at (expires_at)
);

CREATE TABLE user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(100) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_expires_at (expires_at)
);

CREATE TABLE email_verification_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(100) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_expires_at (expires_at)
);

CREATE TABLE venues (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    type ENUM('Auditorium', 'Lecture Theater', 'Outdoor', 'Laboratories') NOT NULL,
    availability ENUM('Available', 'Booked', 'Maintenance') DEFAULT 'Available',
    restrictions TEXT,
    images JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_availability (availability),
    INDEX idx_type (type),
    INDEX idx_capacity (capacity)
);

CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    venue_id INT NOT NULL,
    event_title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    participants INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'under_review') DEFAULT 'pending',
    urgency ENUM('low', 'medium', 'high') DEFAULT 'medium',
    facilities JSON,
    approved_by INT NULL,
    rejected_by INT NULL,
    approval_comment TEXT,
    rejection_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_date (date),
    INDEX idx_user_id (user_id),
    INDEX idx_venue_id (venue_id)
);

CREATE TABLE event_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    organizer VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time TIME NULL,
    participants INT DEFAULT 0,
    status ENUM('draft', 'submitted', 'approved', 'rejected') DEFAULT 'draft',
    current_stage INT DEFAULT 1,
    facilities JSON NULL,
    documents JSON NULL,
    approval_documents JSON NULL,
    remarks TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_date (date)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE event_plan_approvals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_plan_id INT NOT NULL,
    approval_type ENUM('vc', 'admin', 'warden', 'student_union') NOT NULL,
    document_url VARCHAR(500),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_plan_id) REFERENCES event_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_approval (event_plan_id, approval_type),
    INDEX idx_status (status)
);

CREATE TABLE service_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_name VARCHAR(255) NOT NULL,
    requested_by_user_id INT NOT NULL,
    venue_id INT NOT NULL,
    date_time DATETIME NOT NULL,
    service_type ENUM('Sound System', 'Media') NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    description TEXT,
    approved_by INT NULL,
    rejected_by INT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requested_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_service_type (service_type),
    INDEX idx_date_time (date_time)
);

CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('booking_request', 'booking_approved', 'booking_rejected', 'letter_sent', 'letter_received', 'service_provider_notified', 'final_approval', 'system') NOT NULL,
    status ENUM('unread', 'read') DEFAULT 'unread',
    related_booking_id INT NULL,
    related_venue_id INT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (related_venue_id) REFERENCES venues(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE signed_letters (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    from_role ENUM('vice-chancellor', 'warden', 'student-union', 'administration', 'service-provider') NOT NULL,
    to_role ENUM('super-admin', 'user') NOT NULL,
    letter_type ENUM('approval', 'rejection', 'confirmation') NOT NULL,
    letter_content TEXT NOT NULL,
    signature_data JSON NULL,
    status ENUM('pending', 'sent', 'received') DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    received_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_booking_id (booking_id),
    INDEX idx_from_role (from_role),
    INDEX idx_status (status)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    type ENUM('booking', 'event_plan', 'venue', 'user', 'system') NOT NULL,
    target_id INT NULL,
    target_type VARCHAR(50) NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
);

CREATE TABLE reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    data JSON,
    generated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
);

CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    venue_id INT NOT NULL,
    date DATE NOT NULL,
    participants INT NOT NULL,
    status ENUM('Completed', 'Ongoing', 'Cancelled') DEFAULT 'Completed',
    rating DECIMAL(3,2) NULL,
    feedback_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_date (date),
    INDEX idx_venue_id (venue_id)
);

CREATE TABLE event_feedback (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    attendee_name VARCHAR(255) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_event_id (event_id),
    INDEX idx_rating (rating)
);

INSERT INTO users (name, email, password_hash, role, status, is_email_verified) 
VALUES ('Super Administrator', 'superadmin@university.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super-admin', 'active', TRUE);

INSERT INTO venues (name, capacity, location, type, availability, restrictions, images) VALUES
('E Block Main Auditorium', 500, 'Academic Block E', 'Auditorium', 'Available', 'No food and drinks allowed', '["/E1.jpg"]'),
('Technology Lecture Theater 1', 250, 'Technology Building', 'Lecture Theater', 'Available', 'Professional events only', '["/Tecno.jpg"]'),
('Open Ground', 1000, 'Campus Premises', 'Outdoor', 'Available', 'Weather dependent', '["/Ground.jpg"]'),
('Namunukula Open Air Theater', 700, 'Campus Center', 'Outdoor', 'Available', 'Weather dependent', '["/Open Air Theater.jpg"]');

INSERT INTO users (name, email, password_hash, role, service_type, status, is_email_verified) VALUES
('Sound Pro', 'soundpro@university.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'service-provider', 'Sound System', 'active', TRUE),
('UvaRayon Media', 'uvarayonmedia@university.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'service-provider', 'Media', 'active', TRUE);

INSERT INTO users (name, email, password_hash, role, status, is_email_verified) VALUES
('Vice Chancellor', 'vicechancellor@university.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'vice-chancellor', 'active', TRUE),
('Administration of UWU', 'administrationuwu@university.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'administration', 'active', TRUE),
('Student Union', 'studentunion@university.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student-union', 'active', TRUE),
('Warden', 'warden@university.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'warden', 'active', TRUE);

INSERT INTO users (name, email, password_hash, role, department, status, is_email_verified) VALUES
('Amal', 'amal@university.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'Computer Science', 'active', TRUE),
('FAS', 'fas@university.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'faculty', 'Computer Science and Informatics', 'active', TRUE);
