# 🔐 Password Reset System

## Overview
The Password Reset System provides secure password recovery functionality for users who have forgotten their passwords. It includes token-based authentication, email notifications, and comprehensive security measures.

## 🏗️ Architecture

### Components
1. **Forgot Password API** (`/api/auth/forgot-password.php`)
2. **Token Validation API** (`/api/auth/validate-reset-token.php`)
3. **Password Reset API** (`/api/auth/reset-password.php`)
4. **Password Reset Utility** (`/utils/PasswordResetUtil.php`)
5. **Database Table** (`password_reset_tokens`)

### Security Features
- **Secure Token Generation**: 32-byte cryptographically secure random tokens
- **Token Expiration**: Tokens expire after 1 hour
- **Rate Limiting**: Maximum 3 reset requests per user per 24 hours
- **One-time Use**: Tokens are marked as used after password reset
- **Activity Logging**: All password reset activities are logged
- **Input Validation**: Comprehensive validation of all inputs

## 🗄️ Database Schema

### `password_reset_tokens` Table
```sql
CREATE TABLE password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used TINYINT(1) DEFAULT 0,
    used_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at),
    INDEX idx_used (used)
);
```

## 🚀 API Endpoints

### 1. Forgot Password
**Endpoint**: `POST /api/auth/forgot-password.php`

**Request Body**:
```json
{
    "email": "user@example.com"
}
```

**Response**:
```json
{
    "success": true,
    "message": "Password reset link has been sent to your email address."
}
```

**Process**:
1. Validates email format
2. Checks if user exists (without revealing existence)
3. Generates secure reset token
4. Stores token in database with 1-hour expiry
5. Sends reset email (currently simulated)
6. Logs the activity

### 2. Validate Reset Token
**Endpoint**: `GET /api/auth/validate-reset-token.php?token=abc123`

**Response**:
```json
{
    "success": true,
    "message": "Reset token is valid",
    "data": {
        "user_id": 1,
        "user_name": "John Doe",
        "user_email": "john@example.com",
        "expires_at": "2025-01-15 15:30:00"
    }
}
```

**Process**:
1. Validates token format
2. Checks if token exists and is unused
3. Verifies token hasn't expired
4. Returns user information if valid

### 3. Reset Password
**Endpoint**: `POST /api/auth/reset-password.php`

**Request Body**:
```json
{
    "token": "abc123",
    "password": "NewPassword123!",
    "confirm_password": "NewPassword123!"
}
```

**Response**:
```json
{
    "success": true,
    "message": "Password has been reset successfully. You can now login with your new password."
}
```

**Process**:
1. Validates reset token
2. Checks token expiration
3. Validates password strength
4. Confirms password match
5. Updates user password in database
6. Marks token as used
7. Logs the activity
8. Sends confirmation email

## 🔧 Setup Instructions

### 1. Database Setup
```bash
# Navigate to backend directory
cd Eventra/Backend

# Run the SQL script
mysql -u root -p < database/password_reset_tokens.sql
```

### 2. Test the System
```bash
# Run the test script
php test_password_reset.php
```

### 3. Frontend Integration
Update your frontend to call these API endpoints:

```typescript
// Forgot Password
const response = await fetch('/api/auth/forgot-password.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail })
});

// Validate Token
const tokenResponse = await fetch(`/api/auth/validate-reset-token.php?token=${token}`);

// Reset Password
const resetResponse = await fetch('/api/auth/reset-password.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        token: token,
        password: newPassword,
        confirm_password: confirmPassword
    })
});
```

## 📧 Email Integration

### Current Status
- **Simulated**: Emails are logged to `error_log` instead of being sent
- **Production Ready**: Code structure supports real email integration

### Production Setup
1. **Install PHPMailer**:
   ```bash
   composer require phpmailer/phpmailer
   ```

2. **Configure SMTP** in `config/email.php`:
   ```php
   define('SMTP_HOST', 'smtp.gmail.com');
   define('SMTP_PORT', 587);
   define('SMTP_USERNAME', 'your-email@gmail.com');
   define('SMTP_PASSWORD', 'your-app-password');
   define('SMTP_SECURE', 'tls');
   ```

3. **Replace email simulation** with actual email sending in the API files

### Email Templates
The system supports HTML email templates for:
- Password reset request confirmation
- Password reset completion notification

## 🛡️ Security Considerations

### Token Security
- **Length**: 32 bytes (64 hex characters)
- **Generation**: Cryptographically secure random bytes
- **Storage**: Hashed in database (if needed)
- **Expiration**: 1-hour time limit

### Rate Limiting
- **Maximum Requests**: 3 per user per 24 hours
- **Time Window**: Rolling 24-hour period
- **Cleanup**: Expired tokens automatically removed

### Input Validation
- **Email**: Format validation and sanitization
- **Password**: Strength requirements (8+ chars, mixed case, numbers, symbols)
- **Token**: Format validation and database verification

### Privacy Protection
- **User Existence**: Never reveals if email exists in system
- **Token Exposure**: Minimal information in error messages
- **Activity Logging**: Secure logging with IP and user agent tracking

## 📊 Monitoring and Logging

### Activity Logs
All password reset activities are logged in `activity_logs` table:
- `password_reset_requested`: When user requests reset
- `password_reset_completed`: When password is successfully reset

### Error Logging
- Failed email attempts
- Invalid token attempts
- Database errors
- Security violations

### Cleanup Jobs
- Expired tokens are automatically cleaned up
- Used tokens are marked and tracked
- Old logs can be archived or purged

## 🧪 Testing

### Manual Testing
1. **Request Reset**: Use forgot password form
2. **Check Email**: Verify reset link generation
3. **Validate Token**: Test token validation
4. **Reset Password**: Complete password reset
5. **Verify Login**: Test new password

### Automated Testing
Run the test script:
```bash
php test_password_reset.php
```

### Security Testing
- Test with expired tokens
- Test with invalid tokens
- Test rate limiting
- Test input validation
- Test SQL injection protection

## 🚨 Troubleshooting

### Common Issues
1. **Token Not Found**: Check database table creation
2. **Email Not Sent**: Check error logs and email configuration
3. **Token Expired**: Verify token expiry logic
4. **Database Errors**: Check database connection and permissions

### Debug Mode
Enable debug logging by setting:
```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

### Log Locations
- **PHP Errors**: Check web server error logs
- **Application Logs**: Check `activity_logs` table
- **Email Logs**: Check `error_log` for simulated emails

## 🔄 Maintenance

### Regular Tasks
1. **Token Cleanup**: Remove expired tokens (automatic)
2. **Log Rotation**: Archive old activity logs
3. **Security Updates**: Keep dependencies updated
4. **Performance Monitoring**: Monitor API response times

### Backup
- Backup `password_reset_tokens` table
- Backup `activity_logs` table
- Backup user passwords (encrypted)

## 📚 API Documentation

### Error Codes
- `200`: Success
- `400`: Bad Request (invalid input)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `405`: Method Not Allowed
- `500`: Internal Server Error

### Response Format
```json
{
    "success": boolean,
    "message": "Human readable message",
    "data": {} // Optional data object
}
```

### Rate Limits
- **Forgot Password**: 3 requests per 24 hours per user
- **Token Validation**: No limit (read-only)
- **Password Reset**: 1 per token (one-time use)

## 🎯 Future Enhancements

### Planned Features
1. **SMS Integration**: Two-factor authentication via SMS
2. **Security Questions**: Additional verification methods
3. **Password History**: Prevent password reuse
4. **Account Lockout**: Temporary account suspension
5. **Audit Trail**: Detailed security event logging

### Performance Optimizations
1. **Token Caching**: Redis/Memcached for token storage
2. **Email Queuing**: Asynchronous email processing
3. **Database Indexing**: Optimized query performance
4. **CDN Integration**: Static asset delivery

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Maintainer**: Eventra ESRS Development Team
